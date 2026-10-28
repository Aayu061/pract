"""
Utility to generate a realistic Computer Science Lab Manual (.docx)
with multiple practicals containing Aims, Codes, and execution Outputs.
"""
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor


def generate_sample_lab_manual(output_path: str = "sample_cs_lab_manual.docx") -> str:
    doc = Document()

    # Cover Header
    title = doc.add_heading("Department of Computer Science & Engineering", level=0)
    doc.add_heading("Data Structures & Algorithms Laboratory Manual", level=1)
    doc.add_paragraph("Course Code: CS301 | Academic Year: 2026-2027")
    doc.add_paragraph("Instructor: Prof. Sharma | Student Roll: CS-2026-42\n")

    # Practical 1: Singly Linked List (C++)
    doc.add_heading("Practical 1: Singly Linked List Implementation", level=2)
    doc.add_paragraph("Aim: Write a C++ program to implement Singly Linked List operations including insertion at beginning, insertion at end, deletion, and traversal.")
    doc.add_paragraph("Theory: A linked list is a linear data structure where elements are stored in nodes containing data and a pointer to the next node.")
    doc.add_paragraph("Source Code:")
    doc.add_paragraph("""#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
};

class LinkedList {
    Node* head;
public:
    LinkedList() { head = nullptr; }

    void insertAtHead(int val) {
        Node* newNode = new Node();
        newNode->data = val;
        newNode->next = head;
        head = newNode;
    }

    void display() {
        Node* temp = head;
        cout << "Linked List: ";
        while (temp != nullptr) {
            cout << temp->data << " -> ";
            temp = temp->next;
        }
        cout << "NULL" << endl;
    }
};

int main() {
    LinkedList list;
    list.insertAtHead(30);
    list.insertAtHead(20);
    list.insertAtHead(10);
    list.display();
    return 0;
}""")
    doc.add_paragraph("Output:")
    doc.add_paragraph("""Linked List: 10 -> 20 -> 30 -> NULL
[Process exited with code 0]
Screenshot attached below.""")

    # Practical 2: Binary Search (Python)
    doc.add_heading("Practical 2: Binary Search Algorithm", level=2)
    doc.add_paragraph("Aim: Write a Python program to perform Binary Search on a sorted array and find the time complexity.")
    doc.add_paragraph("Source Code:")
    doc.add_paragraph("""def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1

if __name__ == '__main__':
    data = [12, 24, 32, 45, 55, 67, 89, 99]
    search_key = 45
    result = binary_search(data, search_key)
    if result != -1:
        print(f"Element {search_key} found at index {result}")
    else:
        print("Element not found")""")
    doc.add_paragraph("Sample Execution Output:")
    doc.add_paragraph("""Element 45 found at index 3
Execution time: 0.0012ms""")

    # Practical 3: Stack using Arrays (C)
    doc.add_heading("Practical 3: Stack ADT Implementation", level=2)
    doc.add_paragraph("Aim: To implement push, pop, and peek operations on Stack using an Array in C.")
    doc.add_paragraph("Source Code:")
    doc.add_paragraph("""#include <stdio.h>
#define MAX 5

int stack[MAX];
int top = -1;

void push(int val) {
    if (top == MAX - 1) {
        printf("Stack Overflow!\\n");
        return;
    }
    stack[++top] = val;
    printf("Pushed %d\\n", val);
}

int pop() {
    if (top == -1) {
        printf("Stack Underflow!\\n");
        return -1;
    }
    return stack[top--];
}

int main() {
    push(10);
    push(20);
    push(30);
    printf("Popped: %d\\n", pop());
    return 0;
}""")
    doc.add_paragraph("Output Screen:")
    doc.add_paragraph("""Pushed 10
Pushed 20
Pushed 30
Popped: 30""")

    # Practical 4: Student Database Table Operations (SQL)
    doc.add_heading("Practical 4: SQL DDL and DML Queries", level=2)
    doc.add_paragraph("Aim: Design a database schema for student course management with primary and foreign keys.")
    doc.add_paragraph("SQL Script:")
    doc.add_paragraph("""CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    department VARCHAR(50),
    gpa DECIMAL(3, 2)
);

INSERT INTO Students (student_id, first_name, last_name, department, gpa) VALUES
(101, 'Aayush', 'Patel', 'CSE', 3.85),
(102, 'Sara', 'Khan', 'CSE', 3.92),
(103, 'Rohan', 'Verma', 'IT', 3.45);

SELECT student_id, first_name, gpa 
FROM Students 
WHERE gpa >= 3.50 
ORDER BY gpa DESC;""")
    doc.add_paragraph("Output Result:")
    doc.add_paragraph("""+------------+------------+------+
| student_id | first_name | gpa  |
+------------+------------+------+
|        102 | Sara       | 3.92 |
|        101 | Aayush     | 3.85 |
+------------+------------+------+
2 rows in set (0.00 sec)""")

    target = Path(output_path)
    doc.save(str(target))
    print(f"Sample Lab Manual successfully generated at: {target.resolve()}")
    return str(target.resolve())


if __name__ == "__main__":
    generate_sample_lab_manual("sample_cs_lab_manual.docx")
