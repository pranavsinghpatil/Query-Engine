import os
import logging
import asyncio
from typing import List, Dict, Any

import aiofiles
from docx import Document
import pypdf

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Lazy loading for sentence-transformers model
_model = None

def get_sentence_transformer_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logging.info("SentenceTransformer model loaded.")
        except ImportError:
            logging.error("sentence-transformers library not found. Please install it.")
            return None
    return _model

class DocumentProcessor:
    """
    Handles the processing of unstructured documents, including text extraction,
    chunking, and generating embeddings.
    """
    def __init__(self):
        # NOTE: In a production environment, this would be a connection to a persistent
        # vector database like ChromaDB, FAISS, or a managed service.
        # For this assignment, we use an in-memory store for simplicity.
        self.chunk_store: List[Dict[str, Any]] = []

    async def _extract_text(self, file_path: str, file_type: str) -> str:
        """Asynchronously extracts text from a file based on its type."""
        try:
            if file_type == ".txt":
                async with aiofiles.open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                    return await f.read()
            elif file_type == ".pdf":
                return await asyncio.to_thread(self._extract_text_from_pdf, file_path)
            elif file_type == ".docx":
                return await asyncio.to_thread(self._extract_text_from_docx, file_path)
            else:
                logging.warning(f"Unsupported file type: {file_type} for {file_path}")
                return ""
        except Exception as e:
            logging.error(f"Error extracting text from {file_path}: {e}")
            return ""

    def _extract_text_from_pdf(self, file_path: str) -> str:
        """Helper function to extract text from a PDF file."""
        text = ""
        with open(file_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_text_from_docx(self, file_path: str) -> str:
        """Helper function to extract text from a DOCX file."""
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    def dynamic_chunking(self, content: str, doc_type: str) -> List[str]:
        """
        Splits content into meaningful chunks based on document type.
        Aims to keep related content together.
        """
        chunks = []
        if doc_type in [".pdf", ".docx"]:
            # Split by larger separators first, then smaller ones
            paragraphs = content.split('\n\n')
            current_chunk = ""
            for para in paragraphs:
                if len(current_chunk) + len(para) < 1000: # Combine small paragraphs
                    current_chunk += para + "\n\n"
                else:
                    chunks.append(current_chunk.strip())
                    current_chunk = para + "\n\n"
            if current_chunk:
                chunks.append(current_chunk.strip())
        else: # Simple chunking for plain text
            lines = content.split('\n')
            chunks.extend([line for line in lines if line.strip()])
        
        return [chunk for chunk in chunks if chunk]

    async def process_documents(self, file_paths: List[str], job_id: str, ingestion_status: Dict):
        """
        Asynchronously processes a list of documents, generates embeddings in batches,
        and updates the in-memory vector store.
        """
        model = get_sentence_transformer_model()
        if not model:
            ingestion_status[job_id] = {"status": "Failed", "progress": 100, "message": "Embedding model not available."}
            return

        total_files = len(file_paths)
        all_chunks = []

        for i, file_path in enumerate(file_paths):
            file_name = os.path.basename(file_path)
            ingestion_status[job_id]["status"] = f"Processing {file_name}..."
            
            doc_type = os.path.splitext(file_path)[1].lower()
            content = await self._extract_text(file_path, doc_type)

            if content:
                chunks = self.dynamic_chunking(content, doc_type)
                for j, chunk_content in enumerate(chunks):
                    all_chunks.append({
                        "file_path": file_name,
                        "chunk_id": j,
                        "content": chunk_content
                    })
            ingestion_status[job_id]["progress"] = ((i + 1) / total_files) * 100

        if all_chunks:
            logging.info(f"Generating embeddings for {len(all_chunks)} chunks...")
            ingestion_status[job_id]["status"] = f"Generating embeddings for {len(all_chunks)} chunks..."
            
            chunk_contents = [chunk["content"] for chunk in all_chunks]
            # Use asyncio.to_thread for the blocking encode call
            embeddings = await asyncio.to_thread(model.encode, chunk_contents, batch_size=32)
            
            for i, embedding in enumerate(embeddings):
                all_chunks[i]["embedding"] = embedding
            
            # Atomically update the chunk store
            self.chunk_store.extend(all_chunks)
            logging.info(f"Added {len(all_chunks)} new chunks to the store.")

        ingestion_status[job_id]["status"] = "Completed"
        ingestion_status[job_id]["message"] = f"Successfully processed {total_files} documents."

    async def search_documents(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches for relevant document chunks using vector similarity.
        """
        model = get_sentence_transformer_model()
        if not self.chunk_store or not model:
            return []

        query_embedding = await asyncio.to_thread(model.encode, [query])
        
        # This is computationally expensive for large stores. A real vector DB would index this.
        chunk_embeddings = [chunk["embedding"] for chunk in self.chunk_store]
        
        # Using numpy for similarity calculation
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity

        similarities = cosine_similarity(query_embedding, np.array(chunk_embeddings))[0]
        top_k_indices = similarities.argsort()[-top_k:][::-1]

        return [{
            "file_path": self.chunk_store[i]["file_path"],
            "content": self.chunk_store[i]["content"],
            "similarity": float(similarities[i])
        } for i in top_k_indices]
