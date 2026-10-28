import httpx

def run_e2e_verification():
    client = httpx.Client(base_url="http://127.0.0.1:8000")
    
    # 1. Check health
    health = client.get("/api/health").json()
    assert health["status"] == "ok"
    print("[OK] Backend health: OK")
    
    # 2. Get subjects
    subjects = client.get("/api/subjects").json()
    assert len(subjects) > 0, "No subjects found in database"
    target_subject = subjects[0]
    print(f"[OK] Found subject: {target_subject['code']} - {target_subject['name']} (ID: {target_subject['id']})")
    
    # 3. Test docx upload & separation
    with open("sample_cs_lab_manual.docx", "rb") as f:
        files = {
            "file": ("sample_cs_lab_manual.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        }
        res = client.post("/api/ingest/preview-docx", files=files)
    
    assert res.status_code == 200, f"Upload preview failed: {res.text}"
    preview_data = res.json()
    print(f"[OK] DOCX parsed successfully: {preview_data['total_practicals_found']} practicals found.")
    
    for p in preview_data["practicals"]:
        print(f"   -> Practical {p['practical_number']}: {p['title']} [{p['language']}]")
        print(f"      Code snippet: {p['code'].splitlines()[0][:40]}...")
        assert len(p["code"]) > 20, "Code should not be empty"
        if p["discarded_output"]:
            print(f"      Excluded output: {p['discarded_output'].splitlines()[0][:40]}...")
    
    # 4. Commit practicals into the subject
    commit_payload = {
        "subject_id": target_subject["id"],
        "practicals": [
            {
                "practical_number": p["practical_number"],
                "title": p["title"],
                "description": p["description"],
                "language": p["language"],
                "code": p["code"],
            }
            for p in preview_data["practicals"]
        ]
    }
    commit_res = client.post("/api/ingest/commit", json=commit_payload)
    assert commit_res.status_code == 201, f"Commit failed: {commit_res.text}"
    committed_items = commit_res.json()
    print(f"[OK] Successfully committed {len(committed_items)} practicals into subject {target_subject['code']}.")
    
    # 5. Fetch all practicals for this subject
    all_pracs = client.get(f"/api/subjects/{target_subject['id']}/practicals").json()
    print(f"[OK] Total practicals in subject {target_subject['code']}: {len(all_pracs)}")
    
    # 6. Verify ZIP export
    zip_res = client.get(f"/api/subjects/{target_subject['id']}/export-zip")
    assert zip_res.status_code == 200
    assert len(zip_res.content) > 100
    print(f"[OK] Export ZIP verified ({len(zip_res.content)} bytes).")
    
    print("\nALL END-TO-END VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    run_e2e_verification()
