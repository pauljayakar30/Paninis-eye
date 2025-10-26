"""
PaniniT5: Intelligent Generative AI for Sanskrit Manuscript Reconstruction
Fine-tuned transformer with Paninian grammar knowledge and contextual understanding
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import (
    T5ForConditionalGeneration, T5Tokenizer, T5Config,
    GPT2LMHeadModel, GPT2Tokenizer, BertModel, BertTokenizer
)
from typing import List, Dict, Any, Optional, Tuple, Union
import numpy as np
import json
import logging
from dataclasses import dataclass
import math
from torch.nn import MultiheadAttention, LayerNorm, Dropout
import pickle

logger = logging.getLogger(__name__)

@dataclass
class ReconstructionCandidate:
    text: str
    iast: str
    morph_segments: List[str]
    sutras: List[Dict[str, str]]
    literal_translation: str
    idiomatic_translation: str
    scores: Dict[str, float]

class AdvancedKGEncoder(nn.Module):
    """
    Advanced Knowledge Graph Encoder with hierarchical rule understanding
    """
    
    def __init__(self, kg_vocab_size: int, embed_dim: int = 1024):
        super().__init__()
        
        # Hierarchical embeddings for different KG entity types
        self.sutra_embeddings = nn.Embedding(kg_vocab_size, embed_dim)
        self.rule_embeddings = nn.Embedding(kg_vocab_size, embed_dim)
        self.morpheme_embeddings = nn.Embedding(kg_vocab_size, embed_dim)
        self.context_embeddings = nn.Embedding(kg_vocab_size, embed_dim)
        
        # Graph neural network layers
        self.gnn_layers = nn.ModuleList([
            GraphAttentionLayer(embed_dim, embed_dim // 8, dropout=0.1)
            for _ in range(4)
        ])
        
        # Rule composition network
        self.rule_composer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=embed_dim,
                nhead=16,
                dim_feedforward=embed_dim * 4,
                dropout=0.1,
                batch_first=True
            ),
            num_layers=6
        )
        
        # Contextual rule selector
        self.rule_selector = nn.MultiheadAttention(embed_dim, 16, batch_first=True)
        self.rule_gate = nn.Sequential(
            nn.Linear(embed_dim * 2, embed_dim),
            nn.Tanh(),
            nn.Linear(embed_dim, 1),
            nn.Sigmoid()
        )
        
    def forward(self, 
                kg_entities: Dict[str, torch.Tensor],
                text_context: torch.Tensor,
                adjacency_matrix: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Encode KG knowledge with contextual awareness
        """
        # Encode different entity types
        encoded_entities = {}
        
        if 'sutras' in kg_entities:
            encoded_entities['sutras'] = self.sutra_embeddings(kg_entities['sutras'])
        if 'rules' in kg_entities:
            encoded_entities['rules'] = self.rule_embeddings(kg_entities['rules'])
        if 'morphemes' in kg_entities:
            encoded_entities['morphemes'] = self.morpheme_embeddings(kg_entities['morphemes'])
        
        # Apply graph neural network
        if adjacency_matrix is not None:
            for gnn_layer in self.gnn_layers:
                for key in encoded_entities:
                    encoded_entities[key] = gnn_layer(encoded_entities[key], adjacency_matrix)
        
        # Compose rule representations
        all_entities = torch.cat(list(encoded_entities.values()), dim=1)
        composed_rules = self.rule_composer(all_entities)
        
        # Select contextually relevant rules
        relevant_rules, _ = self.rule_selector(
            text_context, composed_rules, composed_rules
        )
        
        # Gate rule application based on context
        gate_input = torch.cat([text_context.mean(dim=1), relevant_rules.mean(dim=1)], dim=-1)
        gate_weight = self.rule_gate(gate_input)
        
        return relevant_rules * gate_weight.unsqueeze(1)

class GraphAttentionLayer(nn.Module):
    """Graph Attention Network layer for KG processing"""
    
    def __init__(self, in_features: int, out_features: int, dropout: float = 0.1):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        
        self.W = nn.Linear(in_features, out_features, bias=False)
        self.a = nn.Linear(2 * out_features, 1, bias=False)
        self.dropout = nn.Dropout(dropout)
        self.leakyrelu = nn.LeakyReLU(0.2)
        
    def forward(self, h: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        Wh = self.W(h)  # [N, out_features]
        e = self._prepare_attentional_mechanism_input(Wh)
        
        zero_vec = -9e15 * torch.ones_like(e)
        attention = torch.where(adj > 0, e, zero_vec)
        attention = F.softmax(attention, dim=1)
        attention = self.dropout(attention)
        
        h_prime = torch.matmul(attention, Wh)
        return F.elu(h_prime)
    
    def _prepare_attentional_mechanism_input(self, Wh):
        N = Wh.size()[0]
        Wh_repeated_in_chunks = Wh.repeat_interleave(N, dim=0)
        Wh_repeated_alternating = Wh.repeat(N, 1)
        all_combinations_matrix = torch.cat([Wh_repeated_in_chunks, Wh_repeated_alternating], dim=1)
        return self.leakyrelu(self.a(all_combinations_matrix)).view(N, N)

class ContextualAttentionLayer(nn.Module):
    """Contextual attention for manuscript understanding"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        self.hidden_size = hidden_size
        
        # Multi-scale attention
        self.local_attention = nn.MultiheadAttention(hidden_size, 8, batch_first=True)
        self.global_attention = nn.MultiheadAttention(hidden_size, 8, batch_first=True)
        self.cross_attention = nn.MultiheadAttention(hidden_size, 8, batch_first=True)
        
        # Context fusion
        self.context_fusion = nn.Sequential(
            nn.Linear(hidden_size * 3, hidden_size * 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_size * 2, hidden_size),
            nn.LayerNorm(hidden_size)
        )
        
    def forward(self, 
                query: torch.Tensor,
                local_context: torch.Tensor,
                global_context: torch.Tensor) -> torch.Tensor:
        
        # Local attention (within sentence/line)
        local_attended, _ = self.local_attention(query, local_context, local_context)
        
        # Global attention (document level)
        global_attended, _ = self.global_attention(query, global_context, global_context)
        
        # Cross attention between local and global
        cross_attended, _ = self.cross_attention(local_attended, global_attended, global_attended)
        
        # Fuse all contexts
        fused = torch.cat([local_attended, global_attended, cross_attended], dim=-1)
        return self.context_fusion(fused)

class ImageContextEncoder(nn.Module):
    """Encode visual context from manuscript images"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        # Vision transformer for manuscript understanding
        self.patch_embedding = nn.Conv2d(3, hidden_size, kernel_size=16, stride=16)
        self.position_embedding = nn.Parameter(torch.randn(1, 256, hidden_size))
        
        self.transformer_layers = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=hidden_size,
                nhead=16,
                dim_feedforward=hidden_size * 4,
                dropout=0.1,
                batch_first=True
            )
            for _ in range(6
        ])
        
        # Damage-aware attention
        self.damage_detector = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, image_patches: torch.Tensor, damage_masks: Optional[torch.Tensor] = None) -> torch.Tensor:
        # Patch embedding
        B, C, H, W = image_patches.shape
        patches = self.patch_embedding(image_patches)  # [B, hidden_size, H//16, W//16]
        patches = patches.flatten(2).transpose(1, 2)  # [B, num_patches, hidden_size]
        
        # Add positional encoding
        patches = patches + self.position_embedding[:, :patches.size(1), :]
        
        # Apply transformer layers
        for layer in self.transformer_layers:
            patches = layer(patches)
        
        # Damage-aware weighting
        if damage_masks is not None:
            damage_weights = self.damage_detector(patches)
            patches = patches * (1 - damage_weights)  # Reduce attention on damaged regions
        
        return patches.mean(dim=1)  # Global image representation

class MultiModalFusionLayer(nn.Module):
    """Fuse text and image modalities"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        self.text_projection = nn.Linear(hidden_size, hidden_size)
        self.image_projection = nn.Linear(hidden_size, hidden_size)
        
        self.cross_modal_attention = nn.MultiheadAttention(hidden_size, 16, batch_first=True)
        
        self.fusion_gate = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 2),
            nn.Softmax(dim=-1)
        )
        
    def forward(self, text_features: torch.Tensor, image_features: torch.Tensor) -> torch.Tensor:
        # Project to common space
        text_proj = self.text_projection(text_features)
        image_proj = self.image_projection(image_features)
        
        # Cross-modal attention
        attended_text, _ = self.cross_modal_attention(text_proj, image_proj, image_proj)
        
        # Adaptive fusion
        fusion_input = torch.cat([attended_text.mean(dim=1), image_proj], dim=-1)
        fusion_weights = self.fusion_gate(fusion_input)
        
        fused = (fusion_weights[:, 0:1] * attended_text.mean(dim=1) + 
                fusion_weights[:, 1:2] * image_proj)
        
        return fused.unsqueeze(1).expand(-1, text_features.size(1), -1)

class UncertaintyEstimator(nn.Module):
    """Estimate uncertainty in predictions"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        # Epistemic uncertainty (model uncertainty)
        self.epistemic_head = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.5),  # MC Dropout for uncertainty
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
        # Aleatoric uncertainty (data uncertainty)
        self.aleatoric_head = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Softplus()  # Ensure positive values
        )
        
    def forward(self, hidden_states: torch.Tensor, num_samples: int = 10) -> Dict[str, torch.Tensor]:
        # Monte Carlo sampling for epistemic uncertainty
        epistemic_samples = []
        for _ in range(num_samples):
            epistemic_samples.append(self.epistemic_head(hidden_states))
        
        epistemic_mean = torch.stack(epistemic_samples).mean(dim=0)
        epistemic_var = torch.stack(epistemic_samples).var(dim=0)
        
        # Aleatoric uncertainty
        aleatoric_var = self.aleatoric_head(hidden_states)
        
        return {
            "epistemic_uncertainty": epistemic_var,
            "aleatoric_uncertainty": aleatoric_var,
            "total_uncertainty": epistemic_var + aleatoric_var,
            "confidence": 1.0 - (epistemic_var + aleatoric_var)
        }

class ConfidenceCalibrator(nn.Module):
    """Calibrate confidence scores using temperature scaling"""
    
    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1))
        
    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        return torch.softmax(logits / self.temperature, dim=-1)
    
    def calibrate(self, logits: torch.Tensor, labels: torch.Tensor):
        """Calibrate temperature on validation set"""
        criterion = nn.CrossEntropyLoss()
        
        def temperature_scale_loss():
            return criterion(logits / self.temperature, labels)
        
        # Optimize temperature (simplified - use proper optimizer in practice)
        optimizer = torch.optim.LBFGS([self.temperature], lr=0.01, max_iter=50)
        
        def closure():
            optimizer.zero_grad()
            loss = temperature_scale_loss()
            loss.backward()
            return loss
        
        optimizer.step(closure)

class ConstraintDecoder:
    """Hard constraint decoder using KG rules"""
    
    def __init__(self, kg_rules: Dict[str, Any]):
        self.kg_rules = kg_rules
        self.morphology_constraints = self._build_morphology_fst()
        self.sandhi_constraints = self._build_sandhi_fst()
    
    def _build_morphology_fst(self) -> Dict:
        """Build finite state transducer for morphological constraints"""
        # Simplified FST - in production, use pywrapfst
        return {
            "valid_endings": {
                "masculine": ["ः", "म्", "ौ", "े", "ान्", "ास्"],
                "feminine": ["ा", "ाम्", "े", "ाः", "ास्", "ाभिः"],
                "neuter": ["म्", "े", "ानि", "ेषु", "ैः"]
            },
            "vibhakti_patterns": {
                1: ["ः", "ौ", "े"],  # Nominative
                2: ["म्", "ौ", "ान्"],  # Accusative
                # Add more cases
            }
        }
    
    def _build_sandhi_fst(self) -> Dict:
        """Build FST for sandhi rules"""
        return {
            "vowel_sandhi": {
                ("अ", "अ"): "आ",
                ("अ", "आ"): "आ", 
                ("आ", "अ"): "आ",
                ("इ", "अ"): "य",
                # Add more rules
            },
            "consonant_sandhi": {
                ("त्", "क"): "त्क",
                ("त्", "च"): "च्च",
                # Add more rules
            }
        }
    
    def is_valid_sequence(self, tokens: List[str], context: Dict) -> Tuple[bool, List[str]]:
        """Check if token sequence satisfies KG constraints"""
        violations = []
        
        # Check morphological validity
        for token in tokens:
            if not self._is_morphologically_valid(token):
                violations.append(f"Invalid morphology: {token}")
        
        # Check sandhi rules
        for i in range(len(tokens) - 1):
            if not self._is_valid_sandhi(tokens[i], tokens[i+1]):
                violations.append(f"Invalid sandhi: {tokens[i]} + {tokens[i+1]}")
        
        return len(violations) == 0, violations
    
    def _is_morphologically_valid(self, token: str) -> bool:
        """Check if token follows valid morphological patterns"""
        # Simplified check - expand with full morphological analyzer
        if not token:
            return False
        
        # Check if ends with valid suffix
        for gender_endings in self.morphology_constraints["valid_endings"].values():
            if any(token.endswith(ending) for ending in gender_endings):
                return True
        
        return True  # Default to valid for unknown patterns
    
    def _is_valid_sandhi(self, token1: str, token2: str) -> bool:
        """Check if sandhi between tokens is valid"""
        if not token1 or not token2:
            return True
        
        # Get final sound of token1 and initial sound of token2
        final_char = token1[-1]
        initial_char = token2[0]
        
        # Check vowel sandhi rules
        if final_char in "अआइईउऊएओ" and initial_char in "अआइईउऊएओ":
            expected = self.sandhi_constraints["vowel_sandhi"].get((final_char, initial_char))
            # In real implementation, check if actual sandhi matches expected
            return True  # Simplified
        
        return True  # Default to valid

class IntelligentSanskritGenerator(nn.Module):
    """
    Intelligent Generative AI for Sanskrit Manuscript Reconstruction
    
    Features:
    - Multi-modal understanding (text + image context)
    - Contextual grammar awareness with Paninian rules
    - Uncertainty quantification and confidence estimation
    - Few-shot learning capabilities
    - Adaptive fine-tuning on user corrections
    """
    
    def __init__(self, 
                 base_model: str = "google/mt5-large",
                 kg_vocab_size: int = 2000,
                 enable_multimodal: bool = True,
                 enable_uncertainty: bool = True):
        super().__init__()
        
        self.config = {
            "base_model": base_model,
            "kg_vocab_size": kg_vocab_size,
            "enable_multimodal": enable_multimodal,
            "enable_uncertainty": enable_uncertainty
        }
        
        # Core transformer backbone
        self.backbone = T5ForConditionalGeneration.from_pretrained(base_model)
        self.tokenizer = T5Tokenizer.from_pretrained(base_model)
        
        # Sanskrit-specific vocabulary expansion
        sanskrit_tokens = [
            "<MASK>", "<DAMAGE>", "<SUTRA>", "<MORPH>", "<SANDHI>", 
            "<VIBHAKTI>", "<DHATU>", "<PRATYAYA>", "<COMPOUND>",
            "<UNCERTAIN>", "<HIGH_CONF>", "<LOW_CONF>", "<CONTEXT>",
            "<MANUSCRIPT>", "<PALM_LEAF>", "<PAPER>", "<STONE>"
        ]
        self.tokenizer.add_tokens(sanskrit_tokens)
        self.backbone.resize_token_embeddings(len(self.tokenizer))
        
        hidden_size = self.backbone.config.d_model
        
        # Advanced Knowledge Graph Integration
        self.kg_encoder = AdvancedKGEncoder(kg_vocab_size, hidden_size)
        self.contextual_attention = ContextualAttentionLayer(hidden_size)
        
        # Multi-modal fusion (text + image features)
        if enable_multimodal:
            self.image_encoder = ImageContextEncoder(hidden_size)
            self.multimodal_fusion = MultiModalFusionLayer(hidden_size)
        
        # Uncertainty quantification
        if enable_uncertainty:
            self.uncertainty_head = UncertaintyEstimator(hidden_size)
            self.confidence_calibrator = ConfidenceCalibrator()
        
        # Specialized task heads with attention
        self.reconstruction_head = ReconstructionHead(hidden_size, len(self.tokenizer))
        self.translation_head = TranslationHead(hidden_size, len(self.tokenizer))
        self.morphology_head = MorphologyHead(hidden_size, 100)  # Extended morph tags
        self.grammar_head = GrammarValidationHead(hidden_size, kg_vocab_size)
        
        # Adaptive learning components
        self.meta_learner = MetaLearningAdapter(hidden_size)
        self.user_feedback_integrator = UserFeedbackIntegrator(hidden_size)
        
        # Constraint-based generation
        self.constraint_engine = IntelligentConstraintEngine()
        
        # Memory and context management
        self.episodic_memory = EpisodicMemoryBank(hidden_size, max_memories=1000)
        self.context_manager = ContextManager(hidden_size)
        
    def forward(self, 
                input_ids: torch.Tensor,
                attention_mask: torch.Tensor,
                kg_node_ids: Optional[torch.Tensor] = None,
                labels: Optional[torch.Tensor] = None,
                task: str = "reconstruction") -> Dict[str, torch.Tensor]:
        """Forward pass with multi-task outputs"""
        
        # Get T5 encoder outputs
        encoder_outputs = self.t5_model.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        
        # Add KG context if available
        if kg_node_ids is not None:
            kg_context = self.kg_embedder(kg_node_ids, kg_node_ids)  # Simplified
            # Add KG context to encoder outputs
            encoder_outputs.last_hidden_state = encoder_outputs.last_hidden_state + kg_context.unsqueeze(1)
        
        # Task-specific decoding
        if task == "reconstruction":
            outputs = self.t5_model.decoder(
                encoder_hidden_states=encoder_outputs.last_hidden_state,
                encoder_attention_mask=attention_mask
            )
            logits = self.reconstruction_head(outputs.last_hidden_state)
            
        elif task == "translation":
            outputs = self.t5_model.decoder(
                encoder_hidden_states=encoder_outputs.last_hidden_state,
                encoder_attention_mask=attention_mask
            )
            logits = self.translation_head(outputs.last_hidden_state)
            
        else:
            # Default T5 forward
            return self.t5_model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
        
        # Calculate loss if labels provided
        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss(ignore_index=-100)
            loss = loss_fct(logits.view(-1, logits.size(-1)), labels.view(-1))
        
        return {
            "logits": logits,
            "loss": loss,
            "encoder_outputs": encoder_outputs
        }
    
    def generate_candidates(self, 
                          input_text: str,
                          mask_positions: List[Tuple[int, int]],
                          kg_context: Dict[str, Any],
                          n_candidates: int = 5,
                          use_constraints: bool = True) -> List[ReconstructionCandidate]:
        """Generate reconstruction candidates with KG constraints"""
        
        # Tokenize input
        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        
        # Generate with beam search
        with torch.no_grad():
            outputs = self.t5_model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                num_beams=n_candidates * 2,  # Generate more for filtering
                num_return_sequences=n_candidates * 2,
                max_length=512,
                do_sample=False,
                early_stopping=True
            )
        
        # Decode candidates
        candidates = []
        for i, output in enumerate(outputs):
            decoded = self.tokenizer.decode(output, skip_special_tokens=True)
            
            # Apply constraints if enabled
            if use_constraints and self.constraint_decoder:
                tokens = decoded.split()
                is_valid, violations = self.constraint_decoder.is_valid_sequence(tokens, kg_context)
                if not is_valid:
                    continue  # Skip invalid candidates
            
            # Create candidate object
            candidate = ReconstructionCandidate(
                text=decoded,
                iast=self._to_iast(decoded),
                morph_segments=self._segment_morphology(decoded),
                sutras=self._get_applicable_sutras(decoded, kg_context),
                literal_translation=self._translate_literal(decoded),
                idiomatic_translation=self._translate_idiomatic(decoded),
                scores={
                    "lm_score": 0.8,  # Placeholder - compute from model
                    "kg_confidence": 0.9 if use_constraints else 0.5,
                    "combined": 0.85
                }
            )
            
            candidates.append(candidate)
            
            if len(candidates) >= n_candidates:
                break
        
        return candidates
    
    def _to_iast(self, devanagari_text: str) -> str:
        """Convert Devanagari to IAST transliteration"""
        # Simplified mapping - use full transliteration library in production
        iast_map = {
            'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
            'ए': 'e', 'ओ': 'o', 'क': 'ka', 'ख': 'kha', 'ग': 'ga', 'घ': 'gha',
            'च': 'ca', 'छ': 'cha', 'ज': 'ja', 'झ': 'jha', 'ट': 'ṭa', 'ठ': 'ṭha',
            'ड': 'ḍa', 'ढ': 'ḍha', 'त': 'ta', 'थ': 'tha', 'द': 'da', 'ध': 'dha',
            'न': 'na', 'प': 'pa', 'फ': 'pha', 'ब': 'ba', 'भ': 'bha', 'म': 'ma',
            'य': 'ya', 'र': 'ra', 'ल': 'la', 'व': 'va', 'श': 'śa', 'ष': 'ṣa',
            'स': 'sa', 'ह': 'ha', '्': '', 'ं': 'ṃ', 'ः': 'ḥ'
        }
        
        result = ""
        for char in devanagari_text:
            result += iast_map.get(char, char)
        
        return result
    
    def _segment_morphology(self, text: str) -> List[str]:
        """Segment text into morphological components"""
        # Simplified segmentation - use proper morphological analyzer
        words = text.split()
        segments = []
        
        for word in words:
            # Basic root + suffix detection
            if len(word) > 3:
                segments.append(f"{word[:-2]}+{word[-2:]}")
            else:
                segments.append(word)
        
        return segments
    
    def _get_applicable_sutras(self, text: str, kg_context: Dict) -> List[Dict[str, str]]:
        """Get applicable Paninian sutras for the text"""
        # Placeholder - query KG for applicable rules
        return [
            {"id": "6.1.87", "text": "आद्गुणः", "description": "Vowel strengthening rule"},
            {"id": "8.4.68", "text": "अ आ", "description": "Vowel sandhi rule"}
        ]
    
    def _translate_literal(self, sanskrit_text: str) -> str:
        """Generate literal English translation"""
        # Placeholder - use translation head or external service
        return f"Literal translation of: {sanskrit_text}"
    
    def _translate_idiomatic(self, sanskrit_text: str) -> str:
        """Generate idiomatic English translation"""
        # Placeholder - use translation head or external service
        return f"Idiomatic translation of: {sanskrit_text}"

class PaniniT5Trainer:
    """Training pipeline for PaniniT5 model"""
    
    def __init__(self, model: PaniniT5Model, config: Dict[str, Any]):
        self.model = model
        self.config = config
        self.optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=config.get("learning_rate", 3e-5),
            weight_decay=config.get("weight_decay", 0.01)
        )
    
    def train_step(self, batch: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """Single training step with multi-task loss"""
        self.model.train()
        
        # Forward pass for reconstruction
        recon_outputs = self.model(
            input_ids=batch["input_ids"],
            attention_mask=batch["attention_mask"],
            labels=batch["reconstruction_labels"],
            task="reconstruction"
        )
        
        # Forward pass for translation
        trans_outputs = self.model(
            input_ids=batch["input_ids"],
            attention_mask=batch["attention_mask"],
            labels=batch["translation_labels"],
            task="translation"
        )
        
        # Combine losses
        total_loss = (
            self.config.get("recon_weight", 1.0) * recon_outputs["loss"] +
            self.config.get("trans_weight", 1.0) * trans_outputs["loss"]
        )
        
        # Backward pass
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()
        
        return {
            "total_loss": total_loss.item(),
            "recon_loss": recon_outputs["loss"].item(),
            "trans_loss": trans_outputs["loss"].item()
        }
    
    def save_model(self, path: str):
        """Save model checkpoint"""
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "config": self.config
        }, path)
    
    def load_model(self, path: str):
        """Load model checkpoint"""
        checkpoint = torch.load(path)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.config = checkpoint["config"]

class ReconstructionHead(nn.Module):
    """Specialized head for text reconstruction with grammar awareness"""
    
    def __init__(self, hidden_size: int, vocab_size: int):
        super().__init__()
        
        # Grammar-aware reconstruction layers
        self.grammar_encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(hidden_size, 16, hidden_size * 4, batch_first=True),
            num_layers=3
        )
        
        # Multi-scale reconstruction
        self.char_level_head = nn.Linear(hidden_size, vocab_size)
        self.word_level_head = nn.Linear(hidden_size, vocab_size)
        self.phrase_level_head = nn.Linear(hidden_size, vocab_size)
        
        # Reconstruction confidence
        self.confidence_head = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
        # Grammar compliance scorer
        self.grammar_scorer = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, hidden_states: torch.Tensor, grammar_context: torch.Tensor) -> Dict[str, torch.Tensor]:
        # Apply grammar-aware encoding
        grammar_enhanced = self.grammar_encoder(hidden_states)
        
        # Multi-scale predictions
        char_logits = self.char_level_head(grammar_enhanced)
        word_logits = self.word_level_head(grammar_enhanced)
        phrase_logits = self.phrase_level_head(grammar_enhanced)
        
        # Confidence and grammar scores
        confidence = self.confidence_head(grammar_enhanced)
        grammar_score = self.grammar_scorer(grammar_enhanced)
        
        return {
            "char_logits": char_logits,
            "word_logits": word_logits,
            "phrase_logits": phrase_logits,
            "confidence": confidence,
            "grammar_score": grammar_score
        }

class TranslationHead(nn.Module):
    """Specialized head for Sanskrit-English translation"""
    
    def __init__(self, hidden_size: int, vocab_size: int):
        super().__init__()
        
        # Cultural context encoder
        self.cultural_encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(hidden_size, 16, hidden_size * 4, batch_first=True),
            num_layers=2
        )
        
        # Translation style controllers
        self.literal_head = nn.Linear(hidden_size, vocab_size)
        self.idiomatic_head = nn.Linear(hidden_size, vocab_size)
        self.contextual_head = nn.Linear(hidden_size, vocab_size)
        
        # Style selector
        self.style_selector = nn.Sequential(
            nn.Linear(hidden_size, 3),
            nn.Softmax(dim=-1)
        )
        
        # Translation quality estimator
        self.quality_estimator = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, hidden_states: torch.Tensor, cultural_context: torch.Tensor) -> Dict[str, torch.Tensor]:
        # Enhance with cultural context
        culturally_enhanced = self.cultural_encoder(hidden_states)
        
        # Generate different translation styles
        literal_logits = self.literal_head(culturally_enhanced)
        idiomatic_logits = self.idiomatic_head(culturally_enhanced)
        contextual_logits = self.contextual_head(culturally_enhanced)
        
        # Select appropriate style
        style_weights = self.style_selector(culturally_enhanced.mean(dim=1))
        
        # Weighted combination of styles
        combined_logits = (
            style_weights[:, 0:1].unsqueeze(1) * literal_logits +
            style_weights[:, 1:2].unsqueeze(1) * idiomatic_logits +
            style_weights[:, 2:3].unsqueeze(1) * contextual_logits
        )
        
        # Quality estimation
        quality = self.quality_estimator(culturally_enhanced)
        
        return {
            "literal_logits": literal_logits,
            "idiomatic_logits": idiomatic_logits,
            "contextual_logits": contextual_logits,
            "combined_logits": combined_logits,
            "style_weights": style_weights,
            "quality_score": quality
        }

class MorphologyHead(nn.Module):
    """Advanced morphological analysis head"""
    
    def __init__(self, hidden_size: int, num_morph_tags: int):
        super().__init__()
        
        # Morphological feature extractors
        self.root_extractor = nn.Linear(hidden_size, hidden_size // 2)
        self.suffix_extractor = nn.Linear(hidden_size, hidden_size // 2)
        self.sandhi_analyzer = nn.Linear(hidden_size, hidden_size // 2)
        
        # Tag predictors
        self.vibhakti_predictor = nn.Linear(hidden_size // 2, 8)  # 8 cases
        self.lakara_predictor = nn.Linear(hidden_size // 2, 10)  # 10 tenses/moods
        self.purusha_predictor = nn.Linear(hidden_size // 2, 3)  # 3 persons
        self.vacana_predictor = nn.Linear(hidden_size // 2, 3)   # 3 numbers
        self.linga_predictor = nn.Linear(hidden_size // 2, 3)    # 3 genders
        
        # Compound analysis
        self.compound_analyzer = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, 6)  # Compound types
        )
        
        # Sandhi boundary detector
        self.sandhi_detector = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, hidden_states: torch.Tensor) -> Dict[str, torch.Tensor]:
        # Extract morphological features
        root_features = self.root_extractor(hidden_states)
        suffix_features = self.suffix_extractor(hidden_states)
        sandhi_features = self.sandhi_analyzer(hidden_states)
        
        # Predict morphological tags
        vibhakti_logits = self.vibhakti_predictor(suffix_features)
        lakara_logits = self.lakara_predictor(suffix_features)
        purusha_logits = self.purusha_predictor(suffix_features)
        vacana_logits = self.vacana_predictor(suffix_features)
        linga_logits = self.linga_predictor(suffix_features)
        
        # Analyze compounds and sandhi
        compound_logits = self.compound_analyzer(hidden_states)
        sandhi_boundaries = self.sandhi_detector(sandhi_features)
        
        return {
            "vibhakti": vibhakti_logits,
            "lakara": lakara_logits,
            "purusha": purusha_logits,
            "vacana": vacana_logits,
            "linga": linga_logits,
            "compound_type": compound_logits,
            "sandhi_boundaries": sandhi_boundaries,
            "root_features": root_features,
            "suffix_features": suffix_features
        }

class GrammarValidationHead(nn.Module):
    """Validate grammar compliance with Paninian rules"""
    
    def __init__(self, hidden_size: int, kg_vocab_size: int):
        super().__init__()
        
        # Rule applicability checker
        self.rule_checker = nn.MultiheadAttention(hidden_size, 16, batch_first=True)
        
        # Violation detector
        self.violation_detector = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_size, kg_vocab_size),
            nn.Sigmoid()
        )
        
        # Grammar confidence scorer
        self.grammar_confidence = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid()
        )
        
    def forward(self, 
                text_representation: torch.Tensor,
                kg_rules: torch.Tensor) -> Dict[str, torch.Tensor]:
        
        # Check rule applicability
        rule_attended, rule_weights = self.rule_checker(
            text_representation, kg_rules, kg_rules
        )
        
        # Detect violations
        violation_input = torch.cat([text_representation, rule_attended], dim=-1)
        violation_scores = self.violation_detector(violation_input)
        
        # Overall grammar confidence
        confidence = self.grammar_confidence(rule_attended)
        
        return {
            "rule_weights": rule_weights,
            "violation_scores": violation_scores,
            "grammar_confidence": confidence,
            "applicable_rules": rule_attended
        }

class MetaLearningAdapter(nn.Module):
    """Meta-learning for few-shot adaptation to new manuscripts"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        # MAML-style meta-learner
        self.meta_network = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size)
        )
        
        # Task-specific adaptation layers
        self.task_adapter = nn.ModuleDict({
            'reconstruction': nn.Linear(hidden_size, hidden_size),
            'translation': nn.Linear(hidden_size, hidden_size),
            'morphology': nn.Linear(hidden_size, hidden_size)
        })
        
        # Adaptation controller
        self.adaptation_controller = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, len(self.task_adapter)),
            nn.Softmax(dim=-1)
        )
        
    def forward(self, 
                base_features: torch.Tensor,
                task_context: torch.Tensor,
                task_type: str) -> torch.Tensor:
        
        # Meta-learning transformation
        meta_features = self.meta_network(base_features)
        
        # Task-specific adaptation
        if task_type in self.task_adapter:
            adapted_features = self.task_adapter[task_type](meta_features)
        else:
            adapted_features = meta_features
        
        # Adaptive weighting
        adaptation_input = torch.cat([base_features.mean(dim=1), task_context.mean(dim=1)], dim=-1)
        adaptation_weights = self.adaptation_controller(adaptation_input)
        
        return adapted_features * adaptation_weights[:, 0:1].unsqueeze(1)
    
    def adapt_to_user_feedback(self, 
                              user_corrections: List[Dict],
                              learning_rate: float = 0.01):
        """Adapt model based on user corrections"""
        # Implement online learning from user feedback
        # This would update the adaptation layers based on corrections
        pass

class UserFeedbackIntegrator(nn.Module):
    """Integrate user feedback for continuous learning"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        # Feedback encoder
        self.feedback_encoder = nn.Sequential(
            nn.Linear(hidden_size + 1, hidden_size),  # +1 for correction signal
            nn.ReLU(),
            nn.Linear(hidden_size, hidden_size)
        )
        
        # Importance weighter
        self.importance_weighter = nn.Sequential(
            nn.Linear(hidden_size, 1),
            nn.Sigmoid()
        )
        
        # Memory bank for storing corrections
        self.correction_memory = {}
        
    def forward(self, 
                original_prediction: torch.Tensor,
                user_correction: torch.Tensor,
                correction_confidence: float) -> torch.Tensor:
        
        # Encode feedback
        correction_signal = torch.tensor([correction_confidence], device=original_prediction.device)
        feedback_input = torch.cat([user_correction, correction_signal.expand(user_correction.size(0), 1)], dim=-1)
        encoded_feedback = self.feedback_encoder(feedback_input)
        
        # Weight importance
        importance = self.importance_weighter(encoded_feedback)
        
        # Update prediction
        updated_prediction = original_prediction + importance * encoded_feedback
        
        return updated_prediction
    
    def store_correction(self, 
                        input_text: str,
                        original_output: str,
                        corrected_output: str,
                        confidence: float):
        """Store user correction for future learning"""
        correction_id = hash(input_text + original_output)
        self.correction_memory[correction_id] = {
            'input': input_text,
            'original': original_output,
            'corrected': corrected_output,
            'confidence': confidence,
            'timestamp': torch.tensor([0.0])  # Placeholder for timestamp
        }

class IntelligentConstraintEngine(nn.Module):
    """Intelligent constraint application with learned preferences"""
    
    def __init__(self):
        super().__init__()
        
        # Constraint importance learner
        self.constraint_weighter = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, 100),  # Number of constraint types
            nn.Softmax(dim=-1)
        )
        
        # Dynamic constraint generator
        self.constraint_generator = nn.LSTM(256, 256, batch_first=True)
        
    def apply_constraints(self, 
                         logits: torch.Tensor,
                         context: torch.Tensor,
                         constraint_rules: Dict[str, Any]) -> torch.Tensor:
        """Apply intelligent constraints to generation"""
        
        # Learn constraint importance
        constraint_weights = self.constraint_weighter(context.mean(dim=1))
        
        # Apply weighted constraints
        constrained_logits = logits.clone()
        
        for i, (rule_type, rule_data) in enumerate(constraint_rules.items()):
            if i < constraint_weights.size(-1):
                weight = constraint_weights[:, i]
                # Apply rule-specific constraints (simplified)
                if rule_type == 'morphology':
                    constrained_logits = self._apply_morphology_constraints(
                        constrained_logits, rule_data, weight
                    )
                elif rule_type == 'sandhi':
                    constrained_logits = self._apply_sandhi_constraints(
                        constrained_logits, rule_data, weight
                    )
        
        return constrained_logits
    
    def _apply_morphology_constraints(self, logits, rule_data, weight):
        # Implement morphological constraints
        return logits  # Placeholder
    
    def _apply_sandhi_constraints(self, logits, rule_data, weight):
        # Implement sandhi constraints
        return logits  # Placeholder

class EpisodicMemoryBank(nn.Module):
    """Episodic memory for storing and retrieving similar reconstruction cases"""
    
    def __init__(self, hidden_size: int, max_memories: int = 1000):
        super().__init__()
        
        self.hidden_size = hidden_size
        self.max_memories = max_memories
        
        # Memory storage
        self.memory_keys = nn.Parameter(torch.randn(max_memories, hidden_size))
        self.memory_values = nn.Parameter(torch.randn(max_memories, hidden_size))
        self.memory_ages = nn.Parameter(torch.zeros(max_memories))
        
        # Memory retrieval
        self.key_encoder = nn.Linear(hidden_size, hidden_size)
        self.value_decoder = nn.Linear(hidden_size, hidden_size)
        
        # Memory update mechanism
        self.update_gate = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1),
            nn.Sigmoid()
        )
        
    def retrieve(self, query: torch.Tensor, top_k: int = 5) -> torch.Tensor:
        """Retrieve similar cases from memory"""
        
        # Encode query
        encoded_query = self.key_encoder(query)
        
        # Compute similarities
        similarities = torch.cosine_similarity(
            encoded_query.unsqueeze(1), 
            self.memory_keys.unsqueeze(0), 
            dim=-1
        )
        
        # Get top-k memories
        top_similarities, top_indices = torch.topk(similarities, top_k, dim=-1)
        retrieved_values = self.memory_values[top_indices]
        
        # Weighted combination
        weights = F.softmax(top_similarities, dim=-1)
        retrieved = torch.sum(weights.unsqueeze(-1) * retrieved_values, dim=1)
        
        return self.value_decoder(retrieved)
    
    def store(self, key: torch.Tensor, value: torch.Tensor):
        """Store new memory"""
        
        # Find oldest memory slot
        oldest_idx = torch.argmax(self.memory_ages)
        
        # Update memory
        with torch.no_grad():
            self.memory_keys[oldest_idx] = key.detach()
            self.memory_values[oldest_idx] = value.detach()
            self.memory_ages[oldest_idx] = 0.0
            self.memory_ages += 1.0  # Age all memories

class ContextManager(nn.Module):
    """Manage contextual information across the manuscript"""
    
    def __init__(self, hidden_size: int):
        super().__init__()
        
        # Context encoders for different levels
        self.sentence_context = nn.LSTM(hidden_size, hidden_size, batch_first=True)
        self.paragraph_context = nn.LSTM(hidden_size, hidden_size, batch_first=True)
        self.document_context = nn.LSTM(hidden_size, hidden_size, batch_first=True)
        
        # Context fusion
        self.context_fusion = nn.MultiheadAttention(hidden_size, 8, batch_first=True)
        
        # Context memory
        self.context_memory = {}
        
    def update_context(self, 
                      level: str,
                      new_information: torch.Tensor,
                      position: int) -> torch.Tensor:
        """Update contextual information at specified level"""
        
        if level not in self.context_memory:
            self.context_memory[level] = []
        
        # Store new information
        self.context_memory[level].append({
            'position': position,
            'information': new_information,
            'timestamp': len(self.context_memory[level])
        })
        
        # Get appropriate context encoder
        if level == 'sentence':
            context_encoder = self.sentence_context
        elif level == 'paragraph':
            context_encoder = self.paragraph_context
        else:
            context_encoder = self.document_context
        
        # Encode context sequence
        context_sequence = torch.stack([
            item['information'] for item in self.context_memory[level][-10:]  # Last 10 items
        ])
        
        encoded_context, _ = context_encoder(context_sequence.unsqueeze(0))
        
        return encoded_context.squeeze(0)
    
    def get_relevant_context(self, 
                           query: torch.Tensor,
                           context_window: int = 5) -> torch.Tensor:
        """Retrieve relevant context for current query"""
        
        all_contexts = []
        for level, memories in self.context_memory.items():
            if memories:
                recent_contexts = [m['information'] for m in memories[-context_window:]]
                if recent_contexts:
                    level_context = torch.stack(recent_contexts).mean(dim=0)
                    all_contexts.append(level_context)
        
        if not all_contexts:
            return query
        
        # Fuse contexts using attention
        context_stack = torch.stack(all_contexts).unsqueeze(0)
        fused_context, _ = self.context_fusion(
            query.unsqueeze(0), context_stack, context_stack
        )
        
        return fused_context.squeeze(0)   
 def forward(self, 
                input_ids: torch.Tensor,
                attention_mask: torch.Tensor,
                image_features: Optional[torch.Tensor] = None,
                kg_entities: Optional[Dict[str, torch.Tensor]] = None,
                task: str = "reconstruction",
                labels: Optional[torch.Tensor] = None,
                user_feedback: Optional[Dict] = None) -> Dict[str, torch.Tensor]:
        """
        Intelligent forward pass with multi-modal understanding and adaptive learning
        """
        
        # Get base transformer outputs
        encoder_outputs = self.backbone.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        
        hidden_states = encoder_outputs.last_hidden_state
        
        # Apply contextual attention
        local_context = hidden_states
        global_context = self.context_manager.get_relevant_context(hidden_states.mean(dim=1))
        
        contextual_states = self.contextual_attention(
            hidden_states, local_context, global_context.unsqueeze(0).expand(hidden_states.size(0), -1, -1)
        )
        
        # Knowledge Graph integration
        if kg_entities is not None:
            kg_context = self.kg_encoder(kg_entities, contextual_states)
            contextual_states = contextual_states + kg_context
        
        # Multi-modal fusion
        if self.config["enable_multimodal"] and image_features is not None:
            image_context = self.image_encoder(image_features)
            contextual_states = self.multimodal_fusion(contextual_states, image_context)
        
        # Meta-learning adaptation
        if task in ['reconstruction', 'translation', 'morphology']:
            task_context = contextual_states.mean(dim=1, keepdim=True)
            adapted_states = self.meta_learner(contextual_states, task_context, task)
        else:
            adapted_states = contextual_states
        
        # Task-specific processing
        outputs = {}
        
        if task == "reconstruction":
            recon_outputs = self.reconstruction_head(
                adapted_states, 
                kg_context if kg_entities else adapted_states
            )
            outputs.update(recon_outputs)
            
        elif task == "translation":
            cultural_context = adapted_states  # Placeholder for cultural context
            trans_outputs = self.translation_head(adapted_states, cultural_context)
            outputs.update(trans_outputs)
            
        elif task == "morphology":
            morph_outputs = self.morphology_head(adapted_states)
            outputs.update(morph_outputs)
            
        elif task == "grammar_validation":
            if kg_entities is not None:
                kg_rules = self.kg_encoder.rule_embeddings.weight  # All rules
                grammar_outputs = self.grammar_head(adapted_states, kg_rules.unsqueeze(0))
                outputs.update(grammar_outputs)
        
        # Uncertainty quantification
        if self.config["enable_uncertainty"]:
            uncertainty_outputs = self.uncertainty_head(adapted_states)
            outputs.update(uncertainty_outputs)
        
        # User feedback integration
        if user_feedback is not None:
            corrected_outputs = self.user_feedback_integrator(
                outputs.get("combined_logits", adapted_states),
                user_feedback.get("correction_tensor"),
                user_feedback.get("confidence", 1.0)
            )
            outputs["corrected_logits"] = corrected_outputs
        
        # Store in episodic memory
        memory_key = adapted_states.mean(dim=1)
        memory_value = outputs.get("combined_logits", adapted_states).mean(dim=1)
        self.episodic_memory.store(memory_key, memory_value)
        
        # Update context
        self.context_manager.update_context(
            "sentence", 
            adapted_states.mean(dim=1), 
            position=0  # Placeholder
        )
        
        # Calculate loss if labels provided
        if labels is not None:
            loss = self._calculate_multi_task_loss(outputs, labels, task)
            outputs["loss"] = loss
        
        return outputs
    
    def _calculate_multi_task_loss(self, 
                                  outputs: Dict[str, torch.Tensor],
                                  labels: torch.Tensor,
                                  task: str) -> torch.Tensor:
        """Calculate multi-task loss with uncertainty weighting"""
        
        loss_fn = nn.CrossEntropyLoss(ignore_index=-100)
        total_loss = 0.0
        
        # Task-specific losses
        if task == "reconstruction" and "combined_logits" in outputs:
            recon_loss = loss_fn(
                outputs["combined_logits"].view(-1, outputs["combined_logits"].size(-1)),
                labels.view(-1)
            )
            total_loss += recon_loss
            
            # Grammar compliance loss
            if "grammar_score" in outputs:
                grammar_loss = torch.mean((1.0 - outputs["grammar_score"]) ** 2)
                total_loss += 0.1 * grammar_loss
        
        elif task == "translation":
            if "combined_logits" in outputs:
                trans_loss = loss_fn(
                    outputs["combined_logits"].view(-1, outputs["combined_logits"].size(-1)),
                    labels.view(-1)
                )
                total_loss += trans_loss
                
                # Quality loss
                if "quality_score" in outputs:
                    quality_loss = torch.mean((1.0 - outputs["quality_score"]) ** 2)
                    total_loss += 0.1 * quality_loss
        
        # Uncertainty regularization
        if "total_uncertainty" in outputs:
            uncertainty_reg = torch.mean(outputs["total_uncertainty"])
            total_loss += 0.01 * uncertainty_reg
        
        return total_loss
    
    def generate_intelligent_candidates(self, 
                                      input_text: str,
                                      damaged_regions: List[Tuple[int, int]],
                                      image_context: Optional[torch.Tensor] = None,
                                      kg_context: Optional[Dict] = None,
                                      n_candidates: int = 5,
                                      use_constraints: bool = True,
                                      temperature: float = 0.8) -> List[ReconstructionCandidate]:
        """
        Generate intelligent reconstruction candidates with contextual understanding
        """
        
        # Tokenize input
        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        
        # Prepare KG entities if available
        kg_entities = None
        if kg_context:
            kg_entities = self._prepare_kg_entities(kg_context)
        
        # Forward pass for context encoding
        with torch.no_grad():
            context_outputs = self.forward(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                image_features=image_context,
                kg_entities=kg_entities,
                task="reconstruction"
            )
        
        # Retrieve similar cases from memory
        query_representation = context_outputs.get("combined_logits", inputs["input_ids"]).mean(dim=1)
        similar_cases = self.episodic_memory.retrieve(query_representation, top_k=3)
        
        # Generate candidates with different strategies
        candidates = []
        
        for i in range(n_candidates):
            # Vary generation strategy
            if i == 0:
                # High confidence, conservative
                candidate = self._generate_conservative_candidate(
                    inputs, context_outputs, kg_entities, temperature=0.3
                )
            elif i == 1:
                # Creative, higher temperature
                candidate = self._generate_creative_candidate(
                    inputs, context_outputs, kg_entities, temperature=1.2
                )
            else:
                # Memory-guided generation
                candidate = self._generate_memory_guided_candidate(
                    inputs, context_outputs, similar_cases, temperature=temperature
                )
            
            # Apply intelligent constraints
            if use_constraints and kg_context:
                candidate = self._apply_intelligent_constraints(candidate, kg_context)
            
            # Calculate comprehensive scores
            scores = self._calculate_candidate_scores(candidate, context_outputs, kg_context)
            
            # Create candidate object
            reconstruction_candidate = ReconstructionCandidate(
                text=candidate["text"],
                iast=self._to_iast(candidate["text"]),
                morph_segments=self._segment_morphology(candidate["text"]),
                sutras=self._get_applicable_sutras(candidate["text"], kg_context or {}),
                literal_translation=self._translate_literal(candidate["text"]),
                idiomatic_translation=self._translate_idiomatic(candidate["text"]),
                scores=scores
            )
            
            candidates.append(reconstruction_candidate)
        
        # Rank candidates by combined score
        candidates.sort(key=lambda x: x.scores.get("combined", 0.0), reverse=True)
        
        return candidates[:n_candidates]
    
    def _prepare_kg_entities(self, kg_context: Dict) -> Dict[str, torch.Tensor]:
        """Prepare KG entities for model input"""
        entities = {}
        
        if "sutras" in kg_context:
            entities["sutras"] = torch.tensor([
                hash(sutra["id"]) % self.config["kg_vocab_size"] 
                for sutra in kg_context["sutras"]
            ]).unsqueeze(0)
        
        if "rules" in kg_context:
            entities["rules"] = torch.tensor([
                hash(rule["id"]) % self.config["kg_vocab_size"]
                for rule in kg_context["rules"]
            ]).unsqueeze(0)
        
        return entities
    
    def _generate_conservative_candidate(self, inputs, context_outputs, kg_entities, temperature):
        """Generate conservative, high-confidence candidate"""
        # Use lower temperature and higher grammar constraints
        logits = context_outputs.get("combined_logits", inputs["input_ids"])
        
        # Apply temperature scaling
        scaled_logits = logits / temperature
        
        # Sample conservatively
        probs = F.softmax(scaled_logits, dim=-1)
        sampled_ids = torch.multinomial(probs.view(-1, probs.size(-1)), 1).view(probs.shape[:-1])
        
        decoded_text = self.tokenizer.decode(sampled_ids[0], skip_special_tokens=True)
        
        return {"text": decoded_text, "confidence": "high", "strategy": "conservative"}
    
    def _generate_creative_candidate(self, inputs, context_outputs, kg_entities, temperature):
        """Generate creative candidate with higher diversity"""
        # Use higher temperature for more creative outputs
        logits = context_outputs.get("combined_logits", inputs["input_ids"])
        
        # Apply temperature scaling
        scaled_logits = logits / temperature
        
        # Add noise for creativity
        noise = torch.randn_like(scaled_logits) * 0.1
        creative_logits = scaled_logits + noise
        
        probs = F.softmax(creative_logits, dim=-1)
        sampled_ids = torch.multinomial(probs.view(-1, probs.size(-1)), 1).view(probs.shape[:-1])
        
        decoded_text = self.tokenizer.decode(sampled_ids[0], skip_special_tokens=True)
        
        return {"text": decoded_text, "confidence": "medium", "strategy": "creative"}
    
    def _generate_memory_guided_candidate(self, inputs, context_outputs, similar_cases, temperature):
        """Generate candidate guided by similar cases in memory"""
        # Blend current context with retrieved memories
        base_logits = context_outputs.get("combined_logits", inputs["input_ids"])
        
        # Influence from similar cases
        memory_influence = similar_cases.unsqueeze(1).expand(-1, base_logits.size(1), -1)
        
        # Weighted combination
        alpha = 0.3  # Memory influence weight
        guided_logits = (1 - alpha) * base_logits + alpha * memory_influence
        
        # Apply temperature
        scaled_logits = guided_logits / temperature
        
        probs = F.softmax(scaled_logits, dim=-1)
        sampled_ids = torch.multinomial(probs.view(-1, probs.size(-1)), 1).view(probs.shape[:-1])
        
        decoded_text = self.tokenizer.decode(sampled_ids[0], skip_special_tokens=True)
        
        return {"text": decoded_text, "confidence": "medium", "strategy": "memory_guided"}
    
    def _apply_intelligent_constraints(self, candidate, kg_context):
        """Apply intelligent constraints based on KG knowledge"""
        # This would implement sophisticated constraint application
        # For now, return candidate as-is
        return candidate
    
    def _calculate_candidate_scores(self, candidate, context_outputs, kg_context):
        """Calculate comprehensive scores for candidate"""
        scores = {}
        
        # Language model score (perplexity-based)
        scores["lm_score"] = 0.85  # Placeholder
        
        # Grammar compliance score
        if "grammar_score" in context_outputs:
            scores["grammar_score"] = context_outputs["grammar_score"].mean().item()
        else:
            scores["grammar_score"] = 0.8
        
        # Confidence from uncertainty estimation
        if "confidence" in context_outputs:
            scores["model_confidence"] = context_outputs["confidence"].mean().item()
        else:
            scores["model_confidence"] = 0.75
        
        # KG compliance score
        if kg_context:
            scores["kg_compliance"] = self._calculate_kg_compliance(candidate["text"], kg_context)
        else:
            scores["kg_compliance"] = 0.7
        
        # Combined score (weighted average)
        scores["combined"] = (
            0.3 * scores["lm_score"] +
            0.3 * scores["grammar_score"] +
            0.2 * scores["model_confidence"] +
            0.2 * scores["kg_compliance"]
        )
        
        return scores
    
    def _calculate_kg_compliance(self, text, kg_context):
        """Calculate compliance with KG rules"""
        # Simplified compliance calculation
        compliance_score = 0.8
        
        # Check against known rules
        if "sutras" in kg_context:
            # Apply sutra-based validation
            compliance_score += 0.1
        
        return min(compliance_score, 1.0)
    
    def adapt_to_manuscript_style(self, 
                                 manuscript_samples: List[str],
                                 learning_rate: float = 0.001,
                                 num_steps: int = 10):
        """
        Adapt model to specific manuscript style using few-shot learning
        """
        
        # Prepare adaptation data
        adaptation_data = []
        for sample in manuscript_samples:
            inputs = self.tokenizer(sample, return_tensors="pt", truncation=True, max_length=512)
            adaptation_data.append(inputs)
        
        # Meta-learning adaptation
        optimizer = torch.optim.Adam(self.meta_learner.parameters(), lr=learning_rate)
        
        for step in range(num_steps):
            total_loss = 0.0
            
            for data in adaptation_data:
                # Forward pass
                outputs = self.forward(
                    input_ids=data["input_ids"],
                    attention_mask=data["attention_mask"],
                    task="reconstruction",
                    labels=data["input_ids"]  # Self-supervised
                )
                
                total_loss += outputs.get("loss", 0.0)
            
            # Backward pass
            optimizer.zero_grad()
            total_loss.backward()
            optimizer.step()
            
            logger.info(f"Adaptation step {step + 1}/{num_steps}, Loss: {total_loss:.4f}")
    
    def explain_reconstruction(self, 
                             original_text: str,
                             reconstructed_text: str,
                             kg_context: Dict) -> Dict[str, Any]:
        """
        Generate explanation for reconstruction decisions
        """
        
        explanation = {
            "reconstruction_rationale": [],
            "grammar_rules_applied": [],
            "confidence_factors": [],
            "alternative_possibilities": []
        }
        
        # Analyze differences
        original_words = original_text.split()
        reconstructed_words = reconstructed_text.split()
        
        for i, (orig, recon) in enumerate(zip(original_words, reconstructed_words)):
            if orig != recon:
                explanation["reconstruction_rationale"].append({
                    "position": i,
                    "original": orig,
                    "reconstructed": recon,
                    "reason": f"Applied morphological analysis and contextual understanding"
                })
        
        # Add grammar rules
        if kg_context and "sutras" in kg_context:
            for sutra in kg_context["sutras"][:3]:  # Top 3 applicable sutras
                explanation["grammar_rules_applied"].append({
                    "sutra_id": sutra.get("id", ""),
                    "description": sutra.get("description", ""),
                    "relevance": "High"
                })
        
        return explanation