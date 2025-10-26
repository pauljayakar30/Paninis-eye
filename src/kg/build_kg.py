"""
Build Paninian Grammar Knowledge Graph
"""
import json
import csv
from typing import Dict, List, Any
from neo4j import GraphDatabase
import logging

logger = logging.getLogger(__name__)

class PaninianKGBuilder:
    """Build and populate Paninian Grammar Knowledge Graph"""
    
    def __init__(self, neo4j_uri: str, neo4j_user: str, neo4j_password: str):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        
    def close(self):
        self.driver.close()
    
    def create_schema(self):
        """Create KG schema and constraints"""
        with self.driver.session() as session:
            # Create constraints
            constraints = [
                "CREATE CONSTRAINT sutra_id IF NOT EXISTS FOR (s:Sutra) REQUIRE s.id IS UNIQUE",
                "CREATE CONSTRAINT rule_id IF NOT EXISTS FOR (r:Rule) REQUIRE r.id IS UNIQUE",
                "CREATE CONSTRAINT dhatu_id IF NOT EXISTS FOR (d:Dhatu) REQUIRE d.root IS UNIQUE",
                "CREATE CONSTRAINT example_id IF NOT EXISTS FOR (e:Example) REQUIRE e.id IS UNIQUE"
            ]
            
            for constraint in constraints:
                try:
                    session.run(constraint)
                    logger.info(f"Created constraint: {constraint}")
                except Exception as e:
                    logger.warning(f"Constraint may already exist: {e}")
    
    def load_sutras(self, sutras_data: List[Dict]):
        """Load Paninian sutras into KG"""
        with self.driver.session() as session:
            for sutra in sutras_data:
                session.run("""
                    MERGE (s:Sutra {id: $id})
                    SET s.text = $text,
                        s.description = $description,
                        s.adhyaya = $adhyaya,
                        s.pada = $pada,
                        s.sutra_num = $sutra_num,
                        s.category = $category
                """, **sutra)
                
                # Add examples
                for example in sutra.get("examples", []):
                    session.run("""
                        MATCH (s:Sutra {id: $sutra_id})
                        MERGE (e:Example {id: $example_id})
                        SET e.sanskrit = $sanskrit,
                            e.translation = $translation,
                            e.explanation = $explanation
                        MERGE (s)-[:HAS_EXAMPLE]->(e)
                    """, 
                    sutra_id=sutra["id"],
                    example_id=f"{sutra['id']}_ex_{example.get('id', 0)}",
                    **example)
    
    def load_sandhi_rules(self, sandhi_data: List[Dict]):
        """Load sandhi rules"""
        with self.driver.session() as session:
            for rule in sandhi_data:
                session.run("""
                    MERGE (r:SandhiRule {id: $id})
                    SET r.pattern = $pattern,
                        r.result = $result,
                        r.condition = $condition,
                        r.type = $type,
                        r.description = $description
                """, **rule)
                
                # Link to applicable sutras
                for sutra_id in rule.get("sutras", []):
                    session.run("""
                        MATCH (r:SandhiRule {id: $rule_id})
                        MATCH (s:Sutra {id: $sutra_id})
                        MERGE (r)-[:GOVERNED_BY]->(s)
                    """, rule_id=rule["id"], sutra_id=sutra_id)
    
    def load_morphology(self, morph_data: List[Dict]):
        """Load morphological data"""
        with self.driver.session() as session:
            # Load dhatus (roots)
            for dhatu in morph_data.get("dhatus", []):
                session.run("""
                    MERGE (d:Dhatu {root: $root})
                    SET d.meaning = $meaning,
                        d.gana = $gana,
                        d.parasmaipada = $parasmaipada,
                        d.atmanepada = $atmanepada
                """, **dhatu)
            
            # Load vibhakti patterns
            for vibhakti in morph_data.get("vibhakti", []):
                session.run("""
                    MERGE (v:Vibhakti {case_num: $case_num})
                    SET v.name = $name,
                        v.meaning = $meaning,
                        v.endings_masculine = $endings_masculine,
                        v.endings_feminine = $endings_feminine,
                        v.endings_neuter = $endings_neuter
                """, **vibhakti)
            
            # Load pratyayas (suffixes)
            for pratyaya in morph_data.get("pratyayas", []):
                session.run("""
                    MERGE (p:Pratyaya {id: $id})
                    SET p.form = $form,
                        p.meaning = $meaning,
                        p.type = $type,
                        p.conditions = $conditions
                """, **pratyaya)
    
    def create_relationships(self):
        """Create semantic relationships between nodes"""
        with self.driver.session() as session:
            # Link sandhi rules to morphological patterns
            session.run("""
                MATCH (sr:SandhiRule)
                MATCH (v:Vibhakti)
                WHERE sr.pattern CONTAINS v.name
                MERGE (sr)-[:APPLIES_TO]->(v)
            """)
            
            # Link dhatus to applicable pratyayas
            session.run("""
                MATCH (d:Dhatu)
                MATCH (p:Pratyaya)
                WHERE p.type = 'verbal' OR d.gana = p.gana
                MERGE (d)-[:CAN_TAKE]->(p)
            """)
    
    def export_kg_data(self, output_path: str):
        """Export KG data to JSON for model integration"""
        with self.driver.session() as session:
            # Get all nodes and relationships
            result = session.run("""
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN n, r, m
            """)
            
            kg_data = {
                "nodes": {},
                "relationships": [],
                "node_embeddings": {}
            }
            
            for record in result:
                node = record["n"]
                rel = record["r"]
                target = record["m"]
                
                # Add nodes
                node_id = f"{list(node.labels)[0]}_{node.id}"
                kg_data["nodes"][node_id] = {
                    "labels": list(node.labels),
                    "properties": dict(node)
                }
                
                if target:
                    target_id = f"{list(target.labels)[0]}_{target.id}"
                    kg_data["nodes"][target_id] = {
                        "labels": list(target.labels),
                        "properties": dict(target)
                    }
                    
                    # Add relationship
                    if rel:
                        kg_data["relationships"].append({
                            "source": node_id,
                            "target": target_id,
                            "type": rel.type,
                            "properties": dict(rel)
                        })
            
            # Save to file
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(kg_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Exported KG data to {output_path}")

def create_sample_data():
    """Create sample Paninian grammar data"""
    
    sutras_data = [
        {
            "id": "6.1.87",
            "text": "आद्गुणः",
            "description": "The vowels a, i, u are replaced by their corresponding guṇa vowels when followed by dissimilar vowels",
            "adhyaya": 6,
            "pada": 1,
            "sutra_num": 87,
            "category": "sandhi",
            "examples": [
                {
                    "id": 1,
                    "sanskrit": "राम + इति = रामेति",
                    "translation": "Rama + iti = rameti",
                    "explanation": "a + i becomes e (guṇa)"
                },
                {
                    "id": 2,
                    "sanskrit": "देव + उवाच = देवोवाच",
                    "translation": "deva + uvāca = devouvāca", 
                    "explanation": "a + u becomes o (guṇa)"
                }
            ]
        },
        {
            "id": "6.1.101",
            "text": "अकः सवर्णे दीर्घः",
            "description": "When a vowel is followed by a similar vowel, they combine to form the long vowel",
            "adhyaya": 6,
            "pada": 1,
            "sutra_num": 101,
            "category": "sandhi",
            "examples": [
                {
                    "id": 1,
                    "sanskrit": "राम + आगच्छति = रामागच्छति",
                    "translation": "rāma + āgacchati = rāmāgacchati",
                    "explanation": "a + ā becomes ā (long vowel)"
                }
            ]
        },
        {
            "id": "8.4.68",
            "text": "अ आ",
            "description": "Rules for the combination of vowels a and ā",
            "adhyaya": 8,
            "pada": 4,
            "sutra_num": 68,
            "category": "sandhi",
            "examples": []
        }
    ]
    
    sandhi_data = [
        {
            "id": "vowel_sandhi_1",
            "pattern": "अ + इ",
            "result": "ए",
            "condition": "guṇa sandhi",
            "type": "vowel_sandhi",
            "description": "a + i = e",
            "sutras": ["6.1.87"]
        },
        {
            "id": "vowel_sandhi_2", 
            "pattern": "अ + उ",
            "result": "ओ",
            "condition": "guṇa sandhi",
            "type": "vowel_sandhi",
            "description": "a + u = o",
            "sutras": ["6.1.87"]
        },
        {
            "id": "vowel_sandhi_3",
            "pattern": "अ + अ",
            "result": "आ",
            "condition": "similar vowel combination",
            "type": "vowel_sandhi", 
            "description": "a + a = ā",
            "sutras": ["6.1.101"]
        }
    ]
    
    morph_data = {
        "dhatus": [
            {
                "root": "गम्",
                "meaning": "to go",
                "gana": 1,
                "parasmaipada": True,
                "atmanepada": False
            },
            {
                "root": "कृ",
                "meaning": "to do/make", 
                "gana": 8,
                "parasmaipada": True,
                "atmanepada": True
            },
            {
                "root": "भू",
                "meaning": "to be/become",
                "gana": 1,
                "parasmaipada": True,
                "atmanepada": False
            }
        ],
        "vibhakti": [
            {
                "case_num": 1,
                "name": "प्रथमा",
                "meaning": "nominative",
                "endings_masculine": ["ः", "ौ", "े"],
                "endings_feminine": ["", "े", "ाः"],
                "endings_neuter": ["म्", "े", "ानि"]
            },
            {
                "case_num": 2,
                "name": "द्वितीया", 
                "meaning": "accusative",
                "endings_masculine": ["म्", "ौ", "ान्"],
                "endings_feminine": ["ाम्", "े", "ाः"],
                "endings_neuter": ["म्", "े", "ानि"]
            }
        ],
        "pratyayas": [
            {
                "id": "ti",
                "form": "ति",
                "meaning": "3rd person singular present",
                "type": "verbal",
                "conditions": ["parasmaipada", "present_tense"]
            },
            {
                "id": "anti",
                "form": "अन्ति",
                "meaning": "3rd person plural present", 
                "type": "verbal",
                "conditions": ["parasmaipada", "present_tense"]
            }
        ]
    }
    
    return sutras_data, sandhi_data, morph_data

def main():
    """Main function to build KG"""
    # Neo4j connection details
    neo4j_uri = "bolt://localhost:7687"
    neo4j_user = "neo4j"
    neo4j_password = "password"
    
    # Initialize builder
    builder = PaninianKGBuilder(neo4j_uri, neo4j_user, neo4j_password)
    
    try:
        # Create schema
        logger.info("Creating KG schema...")
        builder.create_schema()
        
        # Load sample data
        logger.info("Loading sample data...")
        sutras_data, sandhi_data, morph_data = create_sample_data()
        
        builder.load_sutras(sutras_data)
        builder.load_sandhi_rules(sandhi_data)
        builder.load_morphology(morph_data)
        
        # Create relationships
        logger.info("Creating relationships...")
        builder.create_relationships()
        
        # Export for model integration
        logger.info("Exporting KG data...")
        builder.export_kg_data("kg/kg_data.json")
        
        logger.info("KG build completed successfully!")
        
    finally:
        builder.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()