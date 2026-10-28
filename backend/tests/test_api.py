import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_subject_and_practical_flow():
    # 1. Create a Subject
    sub_res = client.post("/api/subjects", json={
        "code": "TEST-CS101",
        "name": "Introduction to Programming",
        "semester": "Semester 1",
        "department": "Computer Science",
        "color": "#10b981",
        "description": "Foundational programming course"
    })
    assert sub_res.status_code == 201
    subject_data = sub_res.json()
    subject_id = subject_data["id"]
    assert subject_data["code"] == "TEST-CS101"

    # 2. Add Practical manually
    prac_res = client.post(f"/api/subjects/{subject_id}/practicals", json={
        "practical_number": 1,
        "title": "Factorial Calculation in Python",
        "description": "Calculates factorial recursively",
        "language": "python",
        "code": "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)\nprint(factorial(5))",
        "tags": "recursion,math"
    })
    assert prac_res.status_code == 201
    prac_data = prac_res.json()
    practical_id = prac_data["id"]
    assert prac_data["language"] == "python"

    # 3. Get practicals of the subject
    list_res = client.get(f"/api/subjects/{subject_id}/practicals")
    assert list_res.status_code == 200
    practicals_list = list_res.json()
    assert len(practicals_list) == 1
    assert practicals_list[0]["title"] == "Factorial Calculation in Python"

    # 4. Edit/Update Practical
    update_res = client.put(f"/api/practicals/{practical_id}", json={
        "title": "Factorial Calculation (Updated)",
        "code": "# Updated code\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)"
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["title"] == "Factorial Calculation (Updated)"
    assert "# Updated code" in updated_data["code"]

    # 5. Export code
    export_res = client.get(f"/api/practicals/{practical_id}/export")
    assert export_res.status_code == 200
    assert "def factorial" in export_res.text

    # 6. Delete practical
    del_prac_res = client.delete(f"/api/practicals/{practical_id}")
    assert del_prac_res.status_code == 204

    # 7. Delete subject
    del_sub_res = client.delete(f"/api/subjects/{subject_id}")
    assert del_sub_res.status_code == 204
