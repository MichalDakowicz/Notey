import flet as ft

import json
import uuid
import os

if not os.path.exists('notes.json'):
    with open('notes.json', 'w') as f:
        json.dump([], f)

class Colors:
    def __init__(self):
        self.COLOR_THEME = 'Blue'
        self.BG = '#1A1C1E'
        self.BGACCENT = '#151618'
        self.TEXT = '#ffffff'
        self.PRIMARY = '#007bff'
        self.SECONDARY = '#0056b3'
        self.SUCCESS = '#28a745'
        self.DANGER = '#dc3545'
        self.WARNING = '#ffc107'
        self.INFO = '#17a2b8'
    
    def setLight(self):
        self.BG = '#f8f9fa'
        self.BGACCENT = '#e9ecef'
        self.TEXT = '#000000'
        
    def setDark(self):
        self.BG = '#1A1C1E'
        self.BGACCENT = '#151618'
        self.TEXT = '#ffffff'
        
    def setBlue(self):
        self.COLOR_THEME = 'Blue'
        self.PRIMARY = '#007bff'
        self.SECONDARY = '#0056b3'
        self.SUCCESS = '#28a745'
        self.DANGER = '#dc3545'
        self.WARNING = '#ffc107'
        self.INFO = '#17a2b8'
    
    def setOlive(self):
        self.COLOR_THEME = 'Olive'
        self.PRIMARY = '#661b04'
        self.SECONDARY = '#8a2e00'
        self.SUCCESS = '#28a745'
        self.DANGER = '#dc3545'
        self.WARNING = '#ffc107'
        self.INFO = '#17a2b8'
        
    def setSunset(self):
        self.COLOR_THEME = 'Sunset'
        self.PRIMARY = '#ff4500'
        self.SECONDARY = '#ff8c00'
        self.SUCCESS = '#28a745'
        self.DANGER = '#dc3545'
        self.WARNING = '#ffc107'
        self.INFO = '#17a2b8'
        
colors = Colors()
    
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
        with open('notes.json', 'r') as f:
            notes_data = json.load(f)
            return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]

    def open_settings(e):
        def set_light_mode(e):
            colors.setLight()
            page.theme_mode = 'light'
            open_settings(e)
            
        def set_dark_mode(e):
            colors.setDark()
            page.theme_mode = 'dark'
            open_settings(e)
                        
        page.clean()
        page.add(ft.AppBar(ft.Image(src=f"logo-transparent.png"), title=ft.Text('Settings', color=colors.TEXT), actions=[ft.IconButton(ft.icons.CLOSE, on_click=lambda e: main(page))], bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
        page.add(ft.Row([ft.IconButton(ft.icons.LIGHT_MODE, on_click=set_light_mode), ft.Text("Light Mode"), ft.IconButton(ft.icons.DARK_MODE, on_click=set_dark_mode), ft.Text("Dark Mode")]))
        page.add(ft.Divider())
        page.add(ft.Text(f'Current Color Theme is {colors.COLOR_THEME}', color=colors.TEXT))
        page.add(ft.Row([ft.CupertinoButton('Blue Theme', bgcolor='#007bff', color=colors.TEXT, on_click=lambda e: (colors.setBlue(), open_settings(e))), ft.CupertinoButton('Olive Theme', bgcolor='#661b04', color=colors.TEXT, on_click=lambda e: (colors.setOlive(), open_settings(e))), ft.CupertinoButton('Sunset Theme', bgcolor='#ff4500', color=colors.TEXT, on_click=lambda e: (colors.setSunset(), open_settings(e)))]))

    def load_note(note_info):
        def save_note(e):
            title = note_title.value
            content = note_content.value
            
            for i, note in enumerate(notes):
                if note.note_id == note_id:
                    notes[i] = Note(title, content, note.note_id)
                    with open('notes.json', 'w') as f:
                        json.dump([note.to_dict() for note in notes], f)
                        
            main(page)
        
        def delete_note_page(note_id):
            for i, note in enumerate(notes):
                if note.note_id == note_id:
                    notes.pop(i)
                    with open('notes.json', 'w') as f:
                        json.dump([note.to_dict() for note in notes], f)
                        
            main(page)
          
        page.clean()
        note_title = ft.TextField(note_info.title, label='Title', hint_text='Title')
        note_content = ft.TextField(note_info.content, label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
        note_id = note_info.note_id
        
        page.add(note_title)
        page.add(note_content)
        page.add(ft.CupertinoButton('Save', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=save_note))
        page.add(ft.CupertinoButton('Cancel', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=lambda e: main(page)))
        page.add(ft.CupertinoButton('Delete', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=lambda e: delete_note_page(note_id)))
        
    def display_notes():   
        if not notes:
            page.add(ft.Text('No notes yet'))
            return 
        for note in notes:
            if note.title:
                page.add(ft.Row([ft.CupertinoButton(note.title, bgcolor=colors.SECONDARY, color=colors.TEXT, on_click=lambda e: load_note(note)), 
                                 ft.TextField(note.content, border=ft.InputBorder.NONE, multiline=True, min_lines=1, max_lines=3, 
                                              hint_text='No content' if not note.content else None, disabled=True, width=(page.width - 250), color=colors.TEXT)]))
            else:
                page.add(ft.Row([ft.CupertinoButton('Untitled', bgcolor=colors.SECONDARY, color=colors.TEXT, on_click=lambda e: load_note(note)), 
                                 ft.TextField(note.content, border=ft.InputBorder.NONE, multiline=True, min_lines=1, max_lines=3, 
                                              hint_text='No content' if not note.content else None, disabled=True, width=(page.width - 250), color=colors.TEXT)]))
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
            
        def delete_note(e):
            note_title.value = ''
            note_content.value = ''
            note_title.focus()
            note_content.focus()
            note_title.update()
            note_title.update()
                
        page.clean()
            
        note_title = ft.TextField(label='Title', hint_text='Title')
        note_content = ft.TextField(label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
        
        page.add(note_title)
        page.add(note_content)
        page.add(ft.CupertinoButton('Save', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=save_note))
        page.add(ft.CupertinoButton('Cancel', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=lambda e: main(page)))
        page.add(ft.CupertinoButton('Delete', bgcolor=colors.PRIMARY, color=colors.TEXT, on_click=delete_note))
    
    page.clean()
    
    page.title = "Notey"
    page.add(ft.AppBar(ft.Image(src=f"logo-transparent.png"), title=ft.Text('Notey', color=colors.TEXT), actions=[
        ft.IconButton(ft.icons.SETTINGS, on_click=open_settings)
        ], bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
    page.add(ft.FloatingActionButton(icon=ft.icons.ADD, on_click=new_note, bgcolor=colors.PRIMARY))
    page.add(ft.Stack())
    
    notes = load_notes()
    
    display_notes()
    
ft.app(target=main)