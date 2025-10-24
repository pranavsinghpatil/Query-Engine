class DocumentProcessor:
    def __init__(self):
        self.documents = {}

    def process_documents(self, file_paths: list):
        for path in file_paths:
            with open(path, "r", errors="ignore") as f:
                self.documents[path] = f.read()
