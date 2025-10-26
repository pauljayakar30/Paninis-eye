"""
Generate synthetic damage for training data
"""
import cv2
import numpy as np
import random
import json
import os
from typing import List, Dict, Tuple, Any
from PIL import Image, ImageDraw, ImageFont
import argparse
import logging

logger = logging.getLogger(__name__)

class SyntheticDamageGenerator:
    """Generate synthetic damage on manuscript images and text"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.damage_types = config.get("damage_types", ["hole", "fade", "blur", "stain"])
        
    def generate_image_damage(self, image: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
        """Apply synthetic damage to image"""
        damaged_image = image.copy()
        damage_masks = []
        
        height, width = image.shape[:2]
        num_damages = random.randint(1, self.config.get("max_damages", 5))
        
        for i in range(num_damages):
            damage_type = random.choice(self.damage_types)
            
            # Random damage location and size
            x = random.randint(0, width - 100)
            y = random.randint(0, height - 50)
            w = random.randint(20, 100)
            h = random.randint(10, 50)
            
            if damage_type == "hole":
                damaged_image, mask = self._create_hole(damaged_image, x, y, w, h)
            elif damage_type == "fade":
                damaged_image, mask = self._create_fade(damaged_image, x, y, w, h)
            elif damage_type == "blur":
                damaged_image, mask = self._create_blur(damaged_image, x, y, w, h)
            elif damage_type == "stain":
                damaged_image, mask = self._create_stain(damaged_image, x, y, w, h)
            
            damage_masks.append({
                "mask_id": f"synth_mask_{i}",
                "bbox": [x, y, w, h],
                "type": damage_type,
                "confidence": 1.0  # Synthetic data has perfect confidence
            })
        
        return damaged_image, damage_masks
    
    def _create_hole(self, image: np.ndarray, x: int, y: int, w: int, h: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create hole damage (black regions)"""
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        
        # Create irregular hole shape
        center = (x + w//2, y + h//2)
        axes = (w//2, h//2)
        
        cv2.ellipse(image, center, axes, 0, 0, 360, (0, 0, 0), -1)
        cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
        
        # Add some noise around edges
        noise_kernel = np.random.randint(0, 2, (5, 5), dtype=np.uint8) * 255
        noise_region = image[y:y+h, x:x+w]
        if noise_region.size > 0:
            noise_region = cv2.morphologyEx(noise_region, cv2.MORPH_ERODE, noise_kernel)
            image[y:y+h, x:x+w] = noise_region
        
        return image, mask
    
    def _create_fade(self, image: np.ndarray, x: int, y: int, w: int, h: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create faded ink damage"""
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        
        # Create fade effect by reducing contrast
        fade_region = image[y:y+h, x:x+w].copy()
        if fade_region.size > 0:
            # Reduce contrast and increase brightness
            fade_region = cv2.convertScaleAbs(fade_region, alpha=0.3, beta=50)
            image[y:y+h, x:x+w] = fade_region
            mask[y:y+h, x:x+w] = 128  # Partial damage
        
        return image, mask
    
    def _create_blur(self, image: np.ndarray, x: int, y: int, w: int, h: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create blur damage"""
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        
        # Apply Gaussian blur
        blur_region = image[y:y+h, x:x+w].copy()
        if blur_region.size > 0:
            kernel_size = random.choice([5, 7, 9, 11])
            blur_region = cv2.GaussianBlur(blur_region, (kernel_size, kernel_size), 0)
            image[y:y+h, x:x+w] = blur_region
            mask[y:y+h, x:x+w] = 100  # Moderate damage
        
        return image, mask
    
    def _create_stain(self, image: np.ndarray, x: int, y: int, w: int, h: int) -> Tuple[np.ndarray, np.ndarray]:
        """Create stain damage"""
        mask = np.zeros(image.shape[:2], dtype=np.uint8)
        
        # Create brownish stain
        stain_color = (20, 50, 80)  # Brown-ish color in BGR
        
        # Create irregular stain shape
        stain_mask = np.zeros(image.shape[:2], dtype=np.uint8)
        center = (x + w//2, y + h//2)
        
        # Multiple overlapping circles for irregular shape
        for _ in range(3):
            offset_x = random.randint(-w//4, w//4)
            offset_y = random.randint(-h//4, h//4)
            radius = random.randint(min(w, h)//4, min(w, h)//2)
            cv2.circle(stain_mask, (center[0] + offset_x, center[1] + offset_y), radius, 255, -1)
        
        # Apply stain
        stain_region = image[y:y+h, x:x+w]
        stain_mask_region = stain_mask[y:y+h, x:x+w]
        
        if stain_region.size > 0 and stain_mask_region.size > 0:
            # Blend stain color with original
            alpha = 0.4
            for c in range(3):
                stain_region[:, :, c] = (1 - alpha) * stain_region[:, :, c] + alpha * stain_color[c]
            
            image[y:y+h, x:x+w] = stain_region
            mask[y:y+h, x:x+w] = stain_mask_region
        
        return image, mask
    
    def generate_text_damage(self, text: str, char_positions: List[Tuple[int, int]]) -> Tuple[str, List[Dict]]:
        """Generate text-level damage by masking tokens"""
        damaged_text = text
        text_masks = []
        
        # Sort positions by start index (descending) to avoid index shifting
        sorted_positions = sorted(char_positions, key=lambda x: x[0], reverse=True)
        
        num_masks = random.randint(1, min(3, len(sorted_positions)))
        selected_positions = random.sample(sorted_positions, num_masks)
        
        for i, (start, end) in enumerate(selected_positions):
            # Replace text with mask token
            mask_token = f"<MASK_{i}>"
            original_text = damaged_text[start:end]
            
            damaged_text = damaged_text[:start] + mask_token + damaged_text[end:]
            
            text_masks.append({
                "mask_id": f"text_mask_{i}",
                "start_char": start,
                "end_char": end,
                "original_text": original_text,
                "mask_token": mask_token,
                "length": end - start
            })
        
        return damaged_text, text_masks
    
    def create_training_sample(self, 
                             original_text: str, 
                             image_path: str = None) -> Dict[str, Any]:
        """Create a complete training sample with image and text damage"""
        
        sample = {
            "original_text": original_text,
            "image_damage": None,
            "text_damage": None,
            "reconstruction_targets": []
        }
        
        # Generate image damage if image provided
        if image_path and os.path.exists(image_path):
            image = cv2.imread(image_path)
            if image is not None:
                damaged_image, image_masks = self.generate_image_damage(image)
                
                # Save damaged image
                output_dir = "data/synthetic/images"
                os.makedirs(output_dir, exist_ok=True)
                
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                damaged_path = f"{output_dir}/{base_name}_damaged.jpg"
                cv2.imwrite(damaged_path, damaged_image)
                
                sample["image_damage"] = {
                    "original_path": image_path,
                    "damaged_path": damaged_path,
                    "masks": image_masks
                }
        
        # Generate text damage
        # Simple word-based tokenization for demo
        words = original_text.split()
        char_positions = []
        current_pos = 0
        
        for word in words:
            start = original_text.find(word, current_pos)
            if start != -1:
                end = start + len(word)
                char_positions.append((start, end))
                current_pos = end
        
        if char_positions:
            damaged_text, text_masks = self.generate_text_damage(original_text, char_positions)
            
            sample["text_damage"] = {
                "damaged_text": damaged_text,
                "masks": text_masks
            }
            
            # Create reconstruction targets
            for mask in text_masks:
                sample["reconstruction_targets"].append({
                    "mask_id": mask["mask_id"],
                    "target_text": mask["original_text"],
                    "context": damaged_text.replace(mask["mask_token"], "<TARGET>")
                })
        
        return sample

def create_sample_texts() -> List[str]:
    """Create sample Sanskrit texts for training"""
    return [
        "राम वनं गच्छति। सीता गृहे तिष्ठति।",
        "धर्मो रक्षति रक्षितः। सत्यमेव जयते।",
        "विद्या ददाति विनयं विनयाद् याति पात्रताम्।",
        "अहिंसा परमो धर्मः धर्म हिंसा तथैव च।",
        "सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।",
        "यत्र नार्यस्तु पूज्यन्ते रमन्ते तत्र देवताः।",
        "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
        "श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः।"
    ]

def main():
    """Main function to generate synthetic training data"""
    parser = argparse.ArgumentParser(description="Generate synthetic damage for Sanskrit manuscripts")
    parser.add_argument("--input", type=str, default="data/raw", help="Input directory with original texts/images")
    parser.add_argument("--output", type=str, default="data/synthetic", help="Output directory for synthetic data")
    parser.add_argument("--num_samples", type=int, default=1000, help="Number of synthetic samples to generate")
    parser.add_argument("--config", type=str, help="Configuration file path")
    
    args = parser.parse_args()
    
    # Default configuration
    config = {
        "damage_types": ["hole", "fade", "blur", "stain"],
        "max_damages": 3,
        "text_mask_probability": 0.3,
        "image_damage_probability": 0.7
    }
    
    # Load custom config if provided
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config.update(json.load(f))
    
    # Initialize generator
    generator = SyntheticDamageGenerator(config)
    
    # Create output directories
    os.makedirs(args.output, exist_ok=True)
    os.makedirs(f"{args.output}/samples", exist_ok=True)
    
    # Generate samples
    sample_texts = create_sample_texts()
    all_samples = []
    
    logger.info(f"Generating {args.num_samples} synthetic samples...")
    
    for i in range(args.num_samples):
        # Select random text
        text = random.choice(sample_texts)
        
        # Add some variation to the text
        if random.random() < 0.3:
            # Combine two texts
            text2 = random.choice(sample_texts)
            text = f"{text} {text2}"
        
        # Generate sample
        sample = generator.create_training_sample(text)
        sample["sample_id"] = f"synth_{i:06d}"
        
        all_samples.append(sample)
        
        # Save individual sample
        sample_path = f"{args.output}/samples/sample_{i:06d}.json"
        with open(sample_path, 'w', encoding='utf-8') as f:
            json.dump(sample, f, ensure_ascii=False, indent=2)
        
        if (i + 1) % 100 == 0:
            logger.info(f"Generated {i + 1} samples...")
    
    # Save combined dataset
    dataset_path = f"{args.output}/synthetic_dataset.json"
    with open(dataset_path, 'w', encoding='utf-8') as f:
        json.dump({
            "metadata": {
                "num_samples": len(all_samples),
                "config": config,
                "generated_at": "2024-01-01T00:00:00Z"  # Placeholder
            },
            "samples": all_samples
        }, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Generated {len(all_samples)} synthetic samples")
    logger.info(f"Dataset saved to {dataset_path}")
    
    # Generate statistics
    stats = {
        "total_samples": len(all_samples),
        "samples_with_image_damage": sum(1 for s in all_samples if s.get("image_damage")),
        "samples_with_text_damage": sum(1 for s in all_samples if s.get("text_damage")),
        "average_masks_per_sample": np.mean([
            len(s.get("text_damage", {}).get("masks", [])) 
            for s in all_samples
        ])
    }
    
    stats_path = f"{args.output}/dataset_stats.json"
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    logger.info(f"Dataset statistics saved to {stats_path}")
    print(f"Statistics: {stats}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()