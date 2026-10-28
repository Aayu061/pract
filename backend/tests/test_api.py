import uuid
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
    code = f"TEST-{uuid.uuid4().hex[:6]}"
    # 1. Create a Subject
    sub_res = client.post("/api/subjects", json={
        "code": code,
        "name": "Introduction to Programming",
        "semester": "Semester 1",
        "department": "Computer Science",
        "color": "#10b981",
        "description": "Foundational programming course"
    })
    assert sub_res.status_code == 201
    subject_data = sub_res.json()
    subject_id = subject_data["id"]
    assert subject_data["code"] == code

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


def test_deletion_with_renumbering():
    del_code = f"CS-DEL-{uuid.uuid4().hex[:6]}"
    # Create Subject
    sub = client.post("/api/subjects", json={"code": del_code, "name": "Deletion Test"}).json()
    sub_id = sub["id"]

    # Create 3 Practicals: #1, #2, #3
    p1 = client.post(f"/api/subjects/{sub_id}/practicals", json={"practical_number": 1, "title": "P1", "code": "x = 1"}).json()
    p2 = client.post(f"/api/subjects/{sub_id}/practicals", json={"practical_number": 2, "title": "P2", "code": "x = 2"}).json()
    p3 = client.post(f"/api/subjects/{sub_id}/practicals", json={"practical_number": 3, "title": "P3", "code": "x = 3"}).json()

    # Delete Practical #2 with renumber=true
    del_res = client.delete(f"/api/practicals/{p2['id']}?renumber=true")
    assert del_res.status_code == 204

    # Fetch practicals: should be 2 remaining, and P3 should now be renumbered to practical_number: 2
    remaining = client.get(f"/api/subjects/{sub_id}/practicals").json()
    assert len(remaining) == 2
    assert remaining[0]["title"] == "P1"
    assert remaining[0]["practical_number"] == 1
    assert remaining[1]["title"] == "P3"
    assert remaining[1]["practical_number"] == 2

    # Clean up subject (tests atomic cascade deletion)
    del_sub = client.delete(f"/api/subjects/{sub_id}")
    assert del_sub.status_code == 204
