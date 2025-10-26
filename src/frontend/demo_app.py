"""
Streamlit Demo App for Sanskrit Manuscript Reconstruction Portal
"""
import streamlit as st
import requests
import json
import io
from PIL import Image
import pandas as pd
from typing import Dict, List, Any
import base64

# Configure page
st.set_page_config(
    page_title="Sanskrit Manuscript Reconstruction Portal",
    page_icon="📜",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API configuration
API_BASE_URL = "http://localhost:8000"

def main():
    st.title("📜 Sanskrit Manuscript Reconstruction Portal")
    st.markdown("*Intelligent reconstruction of damaged Sanskrit manuscripts using AI and Paninian grammar*")
    
    # Sidebar
    with st.sidebar:
        st.header("🔧 Controls")
        
        # Mode selection
        mode = st.selectbox(
            "Reconstruction Mode",
            ["hard", "soft"],
            help="Hard: Strict grammar constraints, Soft: Flexible with confidence scores"
        )
        
        # Number of candidates
        n_candidates = st.slider("Number of Candidates", 1, 10, 5)
        
        # Language settings
        st.subheader("Language Settings")
        show_iast = st.checkbox("Show IAST transliteration", True)
        show_morphology = st.checkbox("Show morphological analysis", True)
        
        # Demo data
        st.subheader("📚 Sample Data")
        if st.button("Load Sample Manuscript"):
            load_sample_data()
    
    # Main interface tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📤 Upload & OCR", 
        "🔍 Reconstruction", 
        "🌐 Translation", 
        "🤖 Assistant", 
        "📊 Knowledge Graph"
    ])
    
    with tab1:
        upload_and_ocr_tab()
    
    with tab2:
        reconstruction_tab(mode, n_candidates, show_iast, show_morphology)
    
    with tab3:
        translation_tab()
    
    with tab4:
        assistant_tab()
    
    with tab5:
        knowledge_graph_tab()

def upload_and_ocr_tab():
    """Upload and OCR processing tab"""
    st.header("📤 Upload Manuscript Image")
    
    # File upload
    uploaded_file = st.file_uploader(
        "Choose a manuscript image",
        type=['png', 'jpg', 'jpeg', 'tiff'],
        help="Upload a scanned image of a Sanskrit manuscript"
    )
    
    if uploaded_file is not None:
        # Display uploaded image
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("📷 Original Image")
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded manuscript", use_column_width=True)
        
        with col2:
            st.subheader("⚙️ Processing Options")
            
            # OCR settings
            dpi = st.selectbox("Image DPI", [150, 300, 600], index=1)
            preprocess = st.checkbox("Apply preprocessing", True)
            
            # Process button
            if st.button("🔍 Process Image", type="primary"):
                process_image(uploaded_file, dpi, preprocess)

def process_image(uploaded_file, dpi: int, preprocess: bool):
    """Process uploaded image through OCR pipeline"""
    with st.spinner("Processing image..."):
        try:
            # Upload to API
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
            response = requests.post(f"{API_BASE_URL}/upload", files=files)
            
            if response.status_code == 200:
                result = response.json()
                
                # Store in session state
                st.session_state.ocr_result = result
                st.session_state.session_id = result["id"]
                
                # Display results
                st.success("✅ OCR processing completed!")
                
                # OCR text preview
                st.subheader("📝 Extracted Text")
                st.text_area("OCR Output", result["ocr_text_preview"], height=150)
                
                # Damage masks
                if result["masks"]:
                    st.subheader("🔍 Detected Damage Regions")
                    mask_df = pd.DataFrame(result["masks"])
                    st.dataframe(mask_df)
                
                # Tokens
                if result["tokens"]:
                    st.subheader("🔤 Tokenization")
                    token_df = pd.DataFrame(result["tokens"])
                    st.dataframe(token_df.head(10))
                
            else:
                st.error(f"❌ OCR processing failed: {response.text}")
                
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")

def reconstruction_tab(mode: str, n_candidates: int, show_iast: bool, show_morphology: bool):
    """Text reconstruction tab"""
    st.header("🔍 Text Reconstruction")
    
    if "ocr_result" not in st.session_state:
        st.info("👆 Please upload and process an image first")
        return
    
    ocr_result = st.session_state.ocr_result
    
    # Mask selection
    if ocr_result.get("masks"):
        st.subheader("🎯 Select Damage Regions to Reconstruct")
        
        mask_options = {}
        for mask in ocr_result["masks"]:
            mask_id = mask["mask_id"]
            bbox = mask["bbox"]
            confidence = mask.get("confidence", 0.0)
            mask_options[f"{mask_id} (confidence: {confidence:.2f})"] = mask_id
        
        selected_masks = st.multiselect(
            "Choose masks to reconstruct",
            options=list(mask_options.keys()),
            default=list(mask_options.keys())[:3]  # Select first 3 by default
        )
        
        if selected_masks and st.button("🚀 Reconstruct Text", type="primary"):
            reconstruct_text(
                [mask_options[mask] for mask in selected_masks],
                mode, 
                n_candidates, 
                show_iast, 
                show_morphology
            )
    else:
        st.warning("⚠️ No damage regions detected in the image")

def reconstruct_text(mask_ids: List[str], mode: str, n_candidates: int, show_iast: bool, show_morphology: bool):
    """Perform text reconstruction"""
    with st.spinner("Reconstructing text..."):
        try:
            # Call reconstruction API
            request_data = {
                "image_id": st.session_state.session_id,
                "mask_ids": mask_ids,
                "mode": mode,
                "n_candidates": n_candidates
            }
            
            response = requests.post(f"{API_BASE_URL}/reconstruct", json=request_data)
            
            if response.status_code == 200:
                result = response.json()
                st.session_state.reconstruction_result = result
                
                # Display candidates
                st.success("✅ Reconstruction completed!")
                display_reconstruction_candidates(result["candidates"], show_iast, show_morphology)
                
                # Performance metrics
                timings = result.get("timings", {})
                st.subheader("⏱️ Performance")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Time", f"{timings.get('total_ms', 0):.0f} ms")
                with col2:
                    st.metric("Model Inference", f"{timings.get('model_inference_ms', 0):.0f} ms")
                with col3:
                    st.metric("KG Lookup", f"{timings.get('kg_lookup_ms', 0):.0f} ms")
                
            else:
                st.error(f"❌ Reconstruction failed: {response.text}")
                
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")

def display_reconstruction_candidates(candidates: List[Dict], show_iast: bool, show_morphology: bool):
    """Display reconstruction candidates"""
    st.subheader("🎯 Reconstruction Candidates")
    
    for i, candidate in enumerate(candidates):
        with st.expander(f"Candidate {i+1}: {candidate['sanskrit_text']}", expanded=(i==0)):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                # Sanskrit text
                st.markdown(f"**Sanskrit:** {candidate['sanskrit_text']}")
                
                # IAST transliteration
                if show_iast:
                    st.markdown(f"**IAST:** {candidate['iast']}")
                
                # Morphological segmentation
                if show_morphology and candidate.get('morph_seg'):
                    st.markdown(f"**Morphology:** {' + '.join(candidate['morph_seg'])}")
                
                # Translations
                st.markdown(f"**Literal:** {candidate['literal_gloss']}")
                st.markdown(f"**Idiomatic:** {candidate['idiomatic_translation']}")
                
                # Applicable sutras
                if candidate.get('sutras'):
                    st.markdown("**Applicable Sutras:**")
                    for sutra in candidate['sutras']:
                        st.markdown(f"- {sutra['id']}: {sutra.get('description', '')}")
            
            with col2:
                # Confidence scores
                st.markdown("**Confidence Scores**")
                scores = candidate.get('scores', {})
                
                for score_name, score_value in scores.items():
                    st.metric(
                        score_name.replace('_', ' ').title(),
                        f"{score_value:.2f}",
                        delta=None
                    )
                
                # Action buttons
                st.markdown("**Actions**")
                if st.button(f"✅ Accept", key=f"accept_{i}"):
                    st.success("Candidate accepted!")
                
                if st.button(f"❓ Explain", key=f"explain_{i}"):
                    explain_candidate(candidate)

def translation_tab():
    """Translation tab"""
    st.header("🌐 Translation")
    
    # Manual text input
    st.subheader("📝 Enter Sanskrit Text")
    sanskrit_input = st.text_area(
        "Sanskrit text (Devanagari)",
        placeholder="Enter Sanskrit text in Devanagari script...",
        height=100
    )
    
    # Translation style
    col1, col2 = st.columns(2)
    with col1:
        style = st.selectbox("Translation Style", ["literal", "idiomatic"])
    with col2:
        if st.button("🔄 Translate", type="primary"):
            if sanskrit_input:
                translate_text(sanskrit_input, style)
    
    # Use reconstruction result
    if "reconstruction_result" in st.session_state:
        st.subheader("🔍 Translate Reconstruction Results")
        candidates = st.session_state.reconstruction_result.get("candidates", [])
        
        if candidates:
            selected_candidate = st.selectbox(
                "Select candidate to translate",
                options=range(len(candidates)),
                format_func=lambda x: f"Candidate {x+1}: {candidates[x]['sanskrit_text']}"
            )
            
            if st.button("🔄 Translate Selected", key="translate_selected"):
                candidate_text = candidates[selected_candidate]['sanskrit_text']
                translate_text(candidate_text, style)

def translate_text(text: str, style: str):
    """Translate Sanskrit text"""
    with st.spinner("Translating..."):
        try:
            request_data = {
                "sanskrit_text": text,
                "style": style
            }
            
            response = requests.post(f"{API_BASE_URL}/translate", json=request_data)
            
            if response.status_code == 200:
                result = response.json()
                
                st.success("✅ Translation completed!")
                
                # Display translation
                st.subheader("📖 Translation Result")
                st.markdown(f"**{style.title()} Translation:** {result['translation']}")
                
                # Word alignment if available
                if result.get('alignment'):
                    st.subheader("🔗 Word Alignment")
                    alignment_df = pd.DataFrame(result['alignment'])
                    st.dataframe(alignment_df)
                
                # Confidence
                confidence = result.get('confidence', 0.0)
                st.metric("Translation Confidence", f"{confidence:.2f}")
                
            else:
                st.error(f"❌ Translation failed: {response.text}")
                
        except Exception as e:
            st.error(f"❌ Error: {str(e)}")

def assistant_tab():
    """Intelligent Manuscript Assistant tab"""
    st.header("🤖 Intelligent Manuscript Assistant (IMA)")
    
    # Chat interface
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    
    # Display chat history
    for message in st.session_state.chat_history:
        if message["role"] == "user":
            st.markdown(f"**You:** {message['content']}")
        else:
            st.markdown(f"**IMA:** {message['content']}")
            
            # Show sources if available
            if message.get("sources"):
                with st.expander("📚 Sources"):
                    for source in message["sources"]:
                        st.markdown(f"- {source.get('kg_node', 'Unknown')}: {source.get('type', '')}")
    
    # Chat input
    user_query = st.text_input("Ask IMA about grammar, sutras, or translations:", key="chat_input")
    
    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        if st.button("💬 Send"):
            if user_query:
                query_assistant(user_query)
    
    with col2:
        if st.button("🗑️ Clear Chat"):
            st.session_state.chat_history = []
            st.rerun()
    
    # Quick questions
    st.subheader("❓ Quick Questions")
    quick_questions = [
        "Explain sutra 6.1.87",
        "What is sandhi?",
        "How does vibhakti work?",
        "Translate this word",
        "Show morphological analysis"
    ]
    
    for question in quick_questions:
        if st.button(question, key=f"quick_{question}"):
            query_assistant(question)

def query_assistant(query: str):
    """Query the assistant"""
    # Add user message to chat
    st.session_state.chat_history.append({"role": "user", "content": query})
    
    try:
        # Get context from current session
        context = {}
        if "reconstruction_result" in st.session_state:
            context["reconstruction_result"] = st.session_state.reconstruction_result
        
        request_data = {
            "query": query,
            "context": context
        }
        
        response = requests.post(f"{API_BASE_URL}/assistant/query", json=request_data)
        
        if response.status_code == 200:
            result = response.json()
            
            # Add assistant response to chat
            st.session_state.chat_history.append({
                "role": "assistant",
                "content": result["answer"],
                "sources": result.get("sources", []),
                "actions": result.get("actions", [])
            })
            
        else:
            st.session_state.chat_history.append({
                "role": "assistant",
                "content": f"Sorry, I encountered an error: {response.text}"
            })
            
    except Exception as e:
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": f"Sorry, I encountered an error: {str(e)}"
        })
    
    st.rerun()

def knowledge_graph_tab():
    """Knowledge Graph visualization tab"""
    st.header("📊 Paninian Grammar Knowledge Graph")
    
    # KG stats (placeholder)
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Sutras", "500+")
    with col2:
        st.metric("Rules", "1,200+")
    with col3:
        st.metric("Examples", "2,500+")
    with col4:
        st.metric("Connections", "5,000+")
    
    # Search KG
    st.subheader("🔍 Search Knowledge Graph")
    search_query = st.text_input("Search for sutras, rules, or concepts:")
    
    if search_query:
        # Mock search results
        st.subheader("📋 Search Results")
        
        mock_results = [
            {
                "id": "6.1.87",
                "type": "sutra",
                "text": "आद्गुणः",
                "description": "Vowel strengthening rule",
                "connections": 15
            },
            {
                "id": "sandhi_vowel",
                "type": "concept",
                "text": "Vowel Sandhi",
                "description": "Rules for vowel combination",
                "connections": 25
            }
        ]
        
        for result in mock_results:
            if search_query.lower() in result["text"].lower() or search_query.lower() in result["description"].lower():
                with st.expander(f"{result['type'].title()}: {result['text']}"):
                    st.markdown(f"**Description:** {result['description']}")
                    st.markdown(f"**Connections:** {result['connections']}")
                    st.markdown(f"**ID:** {result['id']}")
    
    # KG visualization placeholder
    st.subheader("🌐 Graph Visualization")
    st.info("Interactive KG visualization would be implemented here using D3.js or Cytoscape")
    
    # Sample KG structure
    st.subheader("📋 Sample KG Structure")
    sample_kg = {
        "Sutras": ["6.1.87 (आद्गुणः)", "8.4.68 (अ आ)", "6.1.101 (अकः सवर्णे दीर्घः)"],
        "Concepts": ["Sandhi", "Vibhakti", "Dhatu", "Pratyaya"],
        "Rules": ["Vowel Sandhi", "Consonant Sandhi", "Morphology"]
    }
    
    for category, items in sample_kg.items():
        st.markdown(f"**{category}:**")
        for item in items:
            st.markdown(f"- {item}")

def explain_candidate(candidate: Dict):
    """Explain a reconstruction candidate"""
    st.info(f"Explaining candidate: {candidate['sanskrit_text']}")
    
    # This would trigger an assistant query
    explanation_query = f"Explain the reconstruction '{candidate['sanskrit_text']}' and why it's grammatically valid"
    query_assistant(explanation_query)

def load_sample_data():
    """Load sample manuscript data for demo"""
    st.info("Loading sample manuscript... (This would load a pre-processed sample)")
    
    # Mock sample data
    sample_result = {
        "id": "sample_001",
        "ocr_text_preview": "राम वनं गच्छति। सीता गृहे तिष्ठति। [DAMAGED] धर्मं पालयति।",
        "masks": [
            {"mask_id": "mask_0", "bbox": [150, 200, 80, 25], "confidence": 0.9},
            {"mask_id": "mask_1", "bbox": [300, 200, 60, 25], "confidence": 0.8}
        ],
        "tokens": [
            {"text": "राम", "start_char": 0, "end_char": 3, "confidence": 0.95},
            {"text": "वनं", "start_char": 4, "end_char": 7, "confidence": 0.92},
            {"text": "गच्छति", "start_char": 8, "end_char": 14, "confidence": 0.88}
        ]
    }
    
    st.session_state.ocr_result = sample_result
    st.session_state.session_id = sample_result["id"]
    st.success("✅ Sample data loaded!")

if __name__ == "__main__":
    main()