#!/usr/bin/env python3
"""
Demo script for Sanskrit Manuscript Reconstruction Portal
"""
import requests
import json
import time
from pathlib import Path
import argparse

API_BASE_URL = "http://localhost:8000"

def demo_reconstruction_pipeline():
    """Demonstrate the full reconstruction pipeline"""
    print("🔥 Sanskrit Manuscript Reconstruction Portal Demo")
    print("=" * 50)
    
    # Step 1: Create sample text
    sample_text = "राम वनं गच्छति। सीता गृहे तिष्ठति। धर्मो रक्षति रक्षितः।"
    print(f"📝 Original Text: {sample_text}")
    
    # Step 2: Simulate OCR with damage
    damaged_text = "राम वनं गच्छति। <MASK_0> गृहे तिष्ठति। धर्मो <MASK_1> रक्षितः।"
    print(f"🔍 OCR with Damage: {damaged_text}")
    
    # Step 3: Mock upload response
    mock_upload_response = {
        "id": "demo_session_001",
        "ocr_text_preview": damaged_text,
        "masks": [
            {"mask_id": "mask_0", "bbox": [100, 150, 60, 25], "confidence": 0.9},
            {"mask_id": "mask_1", "bbox": [300, 150, 80, 25], "confidence": 0.8}
        ],
        "tokens": [
            {"text": "राम", "start_char": 0, "end_char": 3, "confidence": 0.95},
            {"text": "वनं", "start_char": 4, "end_char": 7, "confidence": 0.92},
            {"text": "गच्छति", "start_char": 8, "end_char": 14, "confidence": 0.88}
        ]
    }
    
    print("\n📤 Upload & OCR Results:")
    print(f"   Session ID: {mock_upload_response['id']}")
    print(f"   Detected Masks: {len(mock_upload_response['masks'])}")
    print(f"   Extracted Tokens: {len(mock_upload_response['tokens'])}")
    
    # Step 4: Reconstruction
    print("\n🔍 Performing Reconstruction...")
    
    reconstruction_request = {
        "image_id": mock_upload_response["id"],
        "mask_ids": ["mask_0", "mask_1"],
        "mode": "hard",
        "n_candidates": 3
    }
    
    # Mock reconstruction response
    mock_reconstruction = {
        "candidates": [
            {
                "candidate_id": "cand_0",
                "sanskrit_text": "सीता",
                "iast": "sītā",
                "morph_seg": ["सीता"],
                "sutras": [{"id": "6.1.87", "description": "Vowel strengthening rule"}],
                "literal_gloss": "Sita",
                "idiomatic_translation": "Sita",
                "scores": {"lm_score": 0.92, "kg_confidence": 0.95, "combined": 0.93}
            },
            {
                "candidate_id": "cand_1", 
                "sanskrit_text": "रक्षति",
                "iast": "rakṣati",
                "morph_seg": ["रक्ष्", "ति"],
                "sutras": [{"id": "3.4.78", "description": "Verbal ending rule"}],
                "literal_gloss": "protects",
                "idiomatic_translation": "protects",
                "scores": {"lm_score": 0.89, "kg_confidence": 0.91, "combined": 0.90}
            }
        ],
        "timings": {"total_ms": 1250, "model_inference_ms": 1000, "kg_lookup_ms": 250}
    }
    
    print("✅ Reconstruction Complete!")
    for i, candidate in enumerate(mock_reconstruction["candidates"]):
        print(f"\n   Candidate {i+1}: {candidate['sanskrit_text']}")
        print(f"   IAST: {candidate['iast']}")
        print(f"   Translation: {candidate['idiomatic_translation']}")
        print(f"   Confidence: {candidate['scores']['combined']:.2f}")
    
    # Step 5: Translation
    print("\n🌐 Generating Translations...")
    
    reconstructed_text = "राम वनं गच्छति। सीता गृहे तिष्ठति। धर्मो रक्षति रक्षितः।"
    
    mock_translation = {
        "translation": "Rama goes to the forest. Sita stays at home. Dharma protects those who protect it.",
        "alignment": [
            {"sanskrit": "राम", "english": "Rama"},
            {"sanskrit": "वनं", "english": "forest"},
            {"sanskrit": "गच्छति", "english": "goes"}
        ],
        "confidence": 0.87
    }
    
    print(f"📖 English Translation: {mock_translation['translation']}")
    print(f"   Confidence: {mock_translation['confidence']:.2f}")
    
    # Step 6: Assistant Query
    print("\n🤖 Querying Intelligent Assistant...")
    
    assistant_query = "Explain the grammar rule for 'गच्छति'"
    
    mock_assistant_response = {
        "answer": "The word 'गच्छति' is the 3rd person singular present tense form of the root 'गम्' (to go). It follows the rule where the root 'गम्' takes the suffix 'ति' in parasmaipada. The form demonstrates the application of sutra 3.4.78 for verbal endings.",
        "sources": [
            {"kg_node": "sutra_3.4.78", "type": "paninian_sutra"},
            {"kg_node": "dhatu_gam", "type": "verbal_root"}
        ],
        "actions": ["show_conjugation", "explain_sutra"]
    }
    
    print(f"❓ Query: {assistant_query}")
    print(f"💬 IMA Response: {mock_assistant_response['answer']}")
    print(f"📚 Sources: {len(mock_assistant_response['sources'])} KG references")
    
    # Step 7: Performance Summary
    print("\n⏱️ Performance Summary:")
    print(f"   Total Processing Time: {mock_reconstruction['timings']['total_ms']} ms")
    print(f"   Model Inference: {mock_reconstruction['timings']['model_inference_ms']} ms")
    print(f"   KG Lookup: {mock_reconstruction['timings']['kg_lookup_ms']} ms")
    
    print("\n🎉 Demo Complete!")
    print("\nNext Steps:")
    print("1. 🚀 Start services: docker-compose up -d")
    print("2. 🌐 Open web interface: http://localhost:8501")
    print("3. 📤 Upload your own manuscript images")
    print("4. 🔍 Explore reconstruction and translation features")

def test_api_endpoints():
    """Test API endpoints if services are running"""
    print("\n🔧 Testing API Endpoints...")
    
    endpoints = [
        ("API Gateway", f"{API_BASE_URL}/health"),
        ("OCR Service", "http://localhost:8001/health"),
        ("Model Service", "http://localhost:8002/health"),
        ("Neo4j", "http://localhost:7474")
    ]
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name}: Running")
            else:
                print(f"⚠️ {name}: Status {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"❌ {name}: Not accessible")

def main():
    parser = argparse.ArgumentParser(description="SMRP Demo Script")
    parser.add_argument("--test-api", action="store_true", help="Test API endpoints")
    parser.add_argument("--full-demo", action="store_true", help="Run full demo")
    
    args = parser.parse_args()
    
    if args.test_api:
        test_api_endpoints()
    elif args.full_demo:
        demo_reconstruction_pipeline()
    else:
        # Default: run both
        demo_reconstruction_pipeline()
        test_api_endpoints()

if __name__ == "__main__":
    main()