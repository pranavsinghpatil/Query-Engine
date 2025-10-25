## NLP Query Engine - Submission Video Script

**Video Length:** 5-7 minutes

---

**(0:00-0:15) Introduction - [Visual: Project Logo/Title Screen, then switch to a view of the running application (frontend)]**

**Narrator:** "Hello everyone, and welcome to the demonstration of our NLP Query Engine. This project aims to build a natural language interface for employee data, capable of dynamically adapting to various database schemas and handling both structured data and unstructured documents. Our goal is to make data querying intuitive and efficient, without requiring users to know SQL or database structures."

---

**(0:15-0:45) Setup & Backend Overview - [Visual: Briefly show terminal running backend (FastAPI) and frontend (React dev server)]**

**Narrator:** "Let's quickly look at the setup. We have a Python FastAPI backend handling all the data processing, schema discovery, and query execution, and a React frontend providing a user-friendly interface. Both are running locally for this demo."

---

**(0:45-1:45) Database Connection & Schema Discovery - [Visual: Focus on the 'Database Connector' panel in the UI]**

**Narrator:** "The first step is to connect to our database. Our engine is designed to work with any SQL database. For this demo, we'll use a local SQLite database. I'll enter the connection string here: `sqlite+aiosqlite:///./default_database.db`."

**[Visual: Type connection string into the input field]**

**Narrator:** "Before analyzing the schema, we can use the 'Test Connection' button to ensure our connection string is valid and the database is accessible."

**[Visual: Click 'Test Connection' button, show success message briefly]**

**Narrator:** "Great, connection successful! Now, let's 'Connect & Analyze'. This process triggers our `SchemaDiscovery` service in the backend. It automatically inspects the database, identifies tables, columns, their data types, and even infers relationships. It also generates semantic embeddings for column names, which are crucial for understanding natural language queries."

**[Visual: Click 'Connect & Analyze' button, show loading spinner, then success message and the 'Schema Visualizer' appearing below]**

**Narrator:** "As you can see, the schema has been discovered. Below, our integrated Schema Visualizer displays the tables and their columns. This dynamic discovery means our system doesn't rely on hard-coded schema information."

**[Visual: Briefly scroll through the Schema Visualizer, pointing out a few tables/columns.]**

---

**(1:45-2:45) Document Ingestion - [Visual: Focus on the 'Document Uploader' panel in the UI]**

**Narrator:** "Next, let's ingest some unstructured data. Our `DocumentUploader` supports drag-and-drop for various file types like PDFs, DOCX, and TXT. I'll drag a few sample employee documents here."

**[Visual: Drag and drop 2-3 sample documents into the drop zone. Show individual progress bars appearing for each file.]**

**Narrator:** "As files are uploaded, you'll see individual progress bars. In the backend, our `DocumentProcessor` handles each file. It extracts text, then uses an intelligent `dynamic_chunking` strategy to split the content into meaningful segments, respecting sentence boundaries. Finally, it generates embeddings for these chunks, storing them for efficient retrieval during document searches."

**[Visual: Show all files completing upload, then a success message.]**

**Narrator:** "All documents processed successfully! This ensures our query engine can search both structured database data and the content of these documents."

---

**(2:45-4:45) Natural Language Querying - [Visual: Focus on the 'Query Panel' and 'Enhanced Results View']**

**Narrator:** "Now for the core functionality: natural language querying. Let's start with a SQL-centric query."

**[Visual: Type 'Show me all employees in the Engineering department' into the Query Panel. Show auto-suggestions appearing as you type, highlighting relevant tables/columns.]**

**Narrator:** "Notice the auto-suggestions appearing as I type. These are generated dynamically from our discovered schema, helping users formulate their queries. When I submit this, our `QueryEngine` classifies it as an SQL query, maps the natural language to the schema using semantic and fuzzy matching, and generates the appropriate SQL."

**[Visual: Click 'Submit Query'. Show loading spinner. Then switch to 'Table View' in 'Enhanced Results View'.]**

**Narrator:** "Here are the results in a sortable and paginated table. You can see the generated SQL query above the table. This demonstrates our enhanced `_generate_sql` function at work."

**[Visual: Briefly show sorting/pagination. Click on the 'Generated SQL' alert to expand/collapse.]**

**Narrator:** "Now, let's try a document-centric query."

**[Visual: Type 'Show me policies about vacation' into the Query Panel.]**

**Narrator:** "This query will be classified as a document search. Our system will use the embeddings of the query to find the most relevant document chunks."

**[Visual: Click 'Submit Query'. Show loading spinner. Then switch to 'Documents' tab in 'Enhanced Results View'.]**

**Narrator:** "The results are displayed as document cards, showing relevant snippets from our uploaded policies. Notice how the matching terms are highlighted, making it easy to spot the relevant information."

**[Visual: Scroll through document cards, pointing out highlighted terms.]**

**Narrator:** "Finally, let's try a hybrid query, combining both structured and unstructured data."

**[Visual: Type 'Who are the employees with Python skills earning over 100k, and show me their resumes?' into the Query Panel.]**

**Narrator:** "This query is classified as hybrid. Our system will query the database for employees matching the salary and skill criteria, and simultaneously search documents for relevant resumes."

**[Visual: Click 'Submit Query'. Show loading spinner. Then switch to 'Hybrid View' in 'Enhanced Results View'.]**

**Narrator:** "In the Hybrid View, we see both the SQL results (employees from the database) and the document results (relevant resume snippets) presented together, clearly labeled. This integrated view provides a comprehensive answer to complex queries."

**[Visual: Briefly show both sections in the Hybrid View.]**

---

**(4:45-5:30) Results Features & Performance Metrics - [Visual: Focus on 'Enhanced Results View' and then briefly show 'Metrics Dashboard' if implemented, otherwise just mention.]**

**Narrator:** "The results view also offers features like exporting data to CSV or JSON, and you can see the query response time displayed, indicating our focus on performance. Our backend also collects various metrics, such as queries processed and documents indexed, which are displayed in our Metrics Dashboard."

**[Visual: Briefly show export buttons, response time chip. If Metrics Dashboard is visible, briefly show it.]**

---

**(5:30-6:00) Conclusion - [Visual: Project Logo/Title Screen or a summary slide]**

**Narrator:** "In summary, our NLP Query Engine provides a powerful and flexible way to interact with diverse employee data. We've demonstrated dynamic schema discovery, intelligent document ingestion, robust natural language querying with improved suggestions and SQL generation, and a comprehensive results display. This system is built with scalability and maintainability in mind, laying a strong foundation for future enhancements."

**Narrator:** "Thank you for watching!"

---
