import flet as ft

import json
import uuid
import os

if not os.path.exists('notes.json'):
    with open('notes.json', 'w') as f:
        json.dump([], f)

class Note:
    def __init__(self, title="Untitled", content="", note_id=None):
        self.title = title
        self.content = content
        if note_id is None:
            self.note_id = str(uuid.uuid4())
        else:
            self.note_id = note_id

    def to_dict(self):
        return {'note_id': self.note_id, 'title': self.title, 'content': self.content}

def main(page: ft.Page):
    def load_notes():
        try:
            with open('notes.json', 'r') as f:
                notes_data = json.load(f)
                return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]
        except FileNotFoundError:
            return []
        
    def load_note(note_info):
        def save_note(e):
            title = note_title.value
            content = note_content.value
            
            for i, note in enumerate(notes):
                if note.note_id == note_id:
                    notes[i] = Note(title, content, note.note_id)
                    with open('notes.json', 'w') as f:
                        json.dump([note.to_dict() for note in notes], f)
            
        page.clean()
        page.add(ft.CupertinoFilledButton('Back', on_click=lambda e: main(page)))
        note_title = ft.TextField(note_info.title, label='Title', hint_text='Title')
        note_content = ft.TextField(note_info.content, label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
        note_id = note_info.note_id
        
        page.add(note_title)
        page.add(note_content)
        page.add(ft.CupertinoFilledButton('Save', on_click=save_note))
        
    def display_notes():   
        if not notes:
            page.add(ft.Text('No notes yet'))
            return 
        for note in notes:
            page.add(ft.CupertinoFilledButton(note.title, on_click=lambda e: load_note(note)))
            page.add(ft.Divider())
    
    def new_note(e):
        def save_note(e):
            title = note_title.value
            content = note_content.value
            
            new_note = Note(title, content)
            notes.append(new_note)
            with open('notes.json', 'w') as f:
                json.dump([note.to_dict() for note in notes], f)
                
            main(page)
                
        page.clean()
            
        note_title = ft.TextField(label='Title', hint_text='Title')
        note_content = ft.TextField(label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
        
        page.add(note_title)
        page.add(note_content)
        page.add(ft.CupertinoFilledButton('Save', on_click=save_note))
        page.add(ft.CupertinoFilledButton('Cancel', on_click=lambda e: main(page)))
        
    
    page.clean()
    
    page.title = "Notey"
    page.add(ft.FloatingActionButton(icon=ft.icons.ADD, on_click=new_note))
    page.add(ft.Stack())
    
    notes = load_notes()
    
    display_notes()
    
ft.app(target=main)