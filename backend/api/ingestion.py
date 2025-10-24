from fastapi import APIRouter, UploadFile, File
from services.document_processor import DocumentProcessor

router = APIRouter()
doc_processor = DocumentProcessor()

@router.post("/upload-documents")
async def upload_documents(files: list[UploadFile] = File(...)):
    file_paths = []

    for f in files:
        path = f"uploaded_{f.filename}"
        content = await f.read()
        with open(path, "wb") as out:
            out.write(content)
        file_paths.append(path)

    doc_processor.process_documents(file_paths)
    return {"message": "Documents uploaded successfully", "files": file_paths}
