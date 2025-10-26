"""
Training script for PaniniT5 model
"""
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import json
import os
import argparse
import logging
from typing import Dict, List, Any, Tuple
import yaml
from transformers import T5Tokenizer, get_linear_schedule_with_warmup
import numpy as np
from tqdm import tqdm
import wandb

try:
    from .panini_t5 import IntelligentSanskritGenerator
except ImportError:
    try:
        from panini_t5 import IntelligentSanskritGenerator
    except ImportError:
        from panini_t5_simple import IntelligentSanskritGenerator

logger = logging.getLogger(__name__)

class SanskritReconstructionDataset(Dataset):
    """Dataset for Sanskrit text reconstruction training"""
    
    def __init__(self, 
                 data_path: str, 
                 tokenizer: T5Tokenizer,
                 max_input_length: int = 512,
                 max_output_length: int = 256):
        
        self.tokenizer = tokenizer
        self.max_input_length = max_input_length
        self.max_output_length = max_output_length
        
        # Load dataset
        with open(data_path, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        self.samples = dataset.get("samples", [])
        logger.info(f"Loaded {len(self.samples)} training samples")
        
        # Prepare training examples
        self.examples = []
        self._prepare_examples()
    
    def _prepare_examples(self):
        """Prepare training examples from samples"""
        for sample in self.samples:
            if not sample.get("text_damage"):
                continue
            
            original_text = sample["original_text"]
            damaged_text = sample["text_damage"]["damaged_text"]
            
            # Create reconstruction examples
            for target in sample.get("reconstruction_targets", []):
                # Input: damaged text with special tokens
                input_text = f"reconstruct: {damaged_text}"
                
                # Output: original text
                output_text = target["target_text"]
                
                # Create translation pair (simplified)
                translation = self._get_simple_translation(output_text)
                
                self.examples.append({
                    "input_text": input_text,
                    "reconstruction_target": output_text,
                    "translation_target": translation,
                    "original_context": original_text,
                    "mask_info": target
                })
    
    def _get_simple_translation(self, sanskrit_text: str) -> str:
        """Get simple English translation (placeholder)"""
        # Simple word-by-word translation for demo
        word_dict = {
            "राम": "Rama",
            "सीता": "Sita",
            "गच्छति": "goes",
            "तिष्ठति": "stays",
            "वनं": "forest",
            "गृहे": "home",
            "धर्म": "dharma",
            "सत्यम्": "truth",
            "विद्या": "knowledge",
            "अहिंसा": "non-violence"
        }
        
        words = sanskrit_text.split()
        translated = [word_dict.get(word, word) for word in words]
        return " ".join(translated)
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        example = self.examples[idx]
        
        # Tokenize input
        input_encoding = self.tokenizer(
            example["input_text"],
            max_length=self.max_input_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        
        # Tokenize reconstruction target
        recon_encoding = self.tokenizer(
            example["reconstruction_target"],
            max_length=self.max_output_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        
        # Tokenize translation target
        trans_encoding = self.tokenizer(
            example["translation_target"],
            max_length=self.max_output_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "input_ids": input_encoding["input_ids"].squeeze(),
            "attention_mask": input_encoding["attention_mask"].squeeze(),
            "reconstruction_labels": recon_encoding["input_ids"].squeeze(),
            "translation_labels": trans_encoding["input_ids"].squeeze(),
            "metadata": example
        }

def load_config(config_path: str) -> Dict[str, Any]:
    """Load training configuration"""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def create_data_loaders(config: Dict[str, Any], tokenizer: T5Tokenizer) -> Tuple[DataLoader, DataLoader]:
    """Create training and validation data loaders"""
    
    # Training dataset
    train_dataset = SanskritReconstructionDataset(
        data_path=config["data"]["train_path"],
        tokenizer=tokenizer,
        max_input_length=config["model"]["max_input_length"],
        max_output_length=config["model"]["max_output_length"]
    )
    
    # Validation dataset
    val_dataset = SanskritReconstructionDataset(
        data_path=config["data"]["val_path"],
        tokenizer=tokenizer,
        max_input_length=config["model"]["max_input_length"],
        max_output_length=config["model"]["max_output_length"]
    )
    
    # Data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=config["training"]["batch_size"],
        shuffle=True,
        num_workers=config["training"].get("num_workers", 4),
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=config["training"]["batch_size"],
        shuffle=False,
        num_workers=config["training"].get("num_workers", 4),
        pin_memory=True
    )
    
    return train_loader, val_loader

def evaluate_model(model: PaniniT5Model, 
                  val_loader: DataLoader, 
                  device: torch.device) -> Dict[str, float]:
    """Evaluate model on validation set"""
    model.eval()
    
    total_recon_loss = 0.0
    total_trans_loss = 0.0
    num_batches = 0
    
    with torch.no_grad():
        for batch in tqdm(val_loader, desc="Evaluating"):
            # Move to device
            batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v 
                    for k, v in batch.items()}
            
            # Forward pass for reconstruction
            recon_outputs = model(
                input_ids=batch["input_ids"],
                attention_mask=batch["attention_mask"],
                labels=batch["reconstruction_labels"],
                task="reconstruction"
            )
            
            # Forward pass for translation
            trans_outputs = model(
                input_ids=batch["input_ids"],
                attention_mask=batch["attention_mask"],
                labels=batch["translation_labels"],
                task="translation"
            )
            
            total_recon_loss += recon_outputs["loss"].item()
            total_trans_loss += trans_outputs["loss"].item()
            num_batches += 1
    
    return {
        "val_recon_loss": total_recon_loss / num_batches,
        "val_trans_loss": total_trans_loss / num_batches,
        "val_total_loss": (total_recon_loss + total_trans_loss) / num_batches
    }

def train_model(config: Dict[str, Any]):
    """Main training function"""
    
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Initialize Intelligent Generative AI model
    model = IntelligentSanskritGenerator(
        base_model=config["model"]["base_model"],
        kg_vocab_size=config["model"]["kg_vocab_size"],
        enable_multimodal=config["model"].get("enable_multimodal", True),
        enable_uncertainty=config["model"].get("enable_uncertainty", True)
    )
    model.to(device)
    
    tokenizer = model.tokenizer
    
    # Create data loaders
    train_loader, val_loader = create_data_loaders(config, tokenizer)
    
    # Initialize trainer
    trainer = PaniniT5Trainer(model, config["training"])
    
    # Initialize wandb if configured
    if config.get("wandb", {}).get("enabled", False):
        wandb.init(
            project=config["wandb"]["project"],
            config=config,
            name=config["wandb"].get("run_name", "panini_t5_training")
        )
    
    # Training loop
    num_epochs = config["training"]["num_epochs"]
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        logger.info(f"Epoch {epoch + 1}/{num_epochs}")
        
        # Training
        model.train()
        epoch_losses = []
        
        progress_bar = tqdm(train_loader, desc=f"Training Epoch {epoch + 1}")
        
        for batch_idx, batch in enumerate(progress_bar):
            # Move to device
            batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v 
                    for k, v in batch.items()}
            
            # Training step
            losses = trainer.train_step(batch)
            epoch_losses.append(losses)
            
            # Update progress bar
            progress_bar.set_postfix({
                "loss": f"{losses['total_loss']:.4f}",
                "recon": f"{losses['recon_loss']:.4f}",
                "trans": f"{losses['trans_loss']:.4f}"
            })
            
            # Log to wandb
            if config.get("wandb", {}).get("enabled", False):
                wandb.log({
                    "train_loss": losses["total_loss"],
                    "train_recon_loss": losses["recon_loss"],
                    "train_trans_loss": losses["trans_loss"],
                    "epoch": epoch,
                    "batch": batch_idx
                })
        
        # Calculate epoch averages
        avg_losses = {
            key: np.mean([loss[key] for loss in epoch_losses])
            for key in epoch_losses[0].keys()
        }
        
        logger.info(f"Epoch {epoch + 1} - Train Loss: {avg_losses['total_loss']:.4f}")
        
        # Validation
        val_metrics = evaluate_model(model, val_loader, device)
        logger.info(f"Epoch {epoch + 1} - Val Loss: {val_metrics['val_total_loss']:.4f}")
        
        # Log validation metrics
        if config.get("wandb", {}).get("enabled", False):
            wandb.log({
                **val_metrics,
                "epoch": epoch
            })
        
        # Save best model
        if val_metrics["val_total_loss"] < best_val_loss:
            best_val_loss = val_metrics["val_total_loss"]
            
            # Save checkpoint
            checkpoint_path = os.path.join(
                config["training"]["output_dir"],
                "best_model.pt"
            )
            os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
            trainer.save_model(checkpoint_path)
            
            logger.info(f"Saved best model with val_loss: {best_val_loss:.4f}")
        
        # Save regular checkpoint
        if (epoch + 1) % config["training"].get("save_every", 5) == 0:
            checkpoint_path = os.path.join(
                config["training"]["output_dir"],
                f"checkpoint_epoch_{epoch + 1}.pt"
            )
            trainer.save_model(checkpoint_path)
    
    logger.info("Training completed!")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Train PaniniT5 model")
    parser.add_argument("--config", type=str, required=True, help="Path to config file")
    parser.add_argument("--resume", type=str, help="Path to checkpoint to resume from")
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Train model
    train_model(config)

if __name__ == "__main__":
    main()