###LMS E-LEARNING PROJECT

Run Python file

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn embedder:app --host 0.0.0.0 --port 8000
