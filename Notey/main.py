import flet as ft

import json
import uuid
import os

# --- App constants and data structures ---
NOTES_FILE = 'notes.json'
SETTINGS_FILE = 'settings.json'

if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump({'theme': 'Blue', 'light-mode': False}, f)

class Colors:
    def __init__(self):
        self.COLOR_THEME = ''
        self.LOGO = ''
        self.BG = ''
        self.BGACCENT = ''
        self.TEXT = ''
        self.BTNTEXT = ''
        self.PRIMARY = ''
        self.SECONDARY = ''
        
        self.SUCCESS = '#28a745'
        self.DANGER = '#dc3545'
        self.WARNING = '#ffc107'
        self.INFO = '#17a2b8'
        
        with open(SETTINGS_FILE, 'r') as f:
            settings = json.load(f)
        
        if settings.get('light-mode'):
            self.setLight()
        else:
            self.setDark()
            
        if settings.get('theme') == 'Blue':
            self.setBlue()
        elif settings.get('theme') == 'Olive':
            self.setOlive()
        elif settings.get('theme') == 'Sunset':
            self.setSunset()
            
        
        
    
    def setLight(self):
        self.BG = '#f8f9fa'
        self.BGACCENT = '#e9ecef'
        self.TEXT = '#000000'
        
        self.save()
        
    def setDark(self):
        self.BG = '#1A1C1E'
        self.BGACCENT = '#151618'
        self.TEXT = '#ffffff'
        
        self.save()
        
    def setBlue(self):
        self.COLOR_THEME = 'Blue'
        self.LOGO = 'assets/logo-transparent-blue.png'
        self.PRIMARY = '#007bff'
        self.SECONDARY = '#0056b3'
        self.BTNTEXT = '#ffffff'
        
        self.save()
    
    def setOlive(self):
        self.COLOR_THEME = 'Olive'
        self.LOGO = 'assets/logo-transparent-olive.png'
        self.PRIMARY = '#8a2e00'
        self.SECONDARY = '#661b04'
        self.BTNTEXT = '#ffffff'
        
        self.save()
        
    def setSunset(self):
        self.COLOR_THEME = 'Sunset'
        self.LOGO = 'assets/logo-transparent-sunset.png'
        self.PRIMARY = '#ff8c00'
        self.SECONDARY = '#ff4500'
        self.BTNTEXT = '#ffffff'

        self.save()

    def save(self):
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                settings = json.load(f)
        else:
            settings = {}

        settings['theme'] = self.COLOR_THEME

        if self.BG == '#f8f9fa':
            settings['light-mode'] = True
        else:
            settings['light-mode'] = False
        
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f)

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

# --- Helper functions ---

def load_notes():
    with open(NOTES_FILE, 'r') as f:
        notes_data = json.load(f)
        return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]


def save_notes(notes):
    notes_data = [note.to_dict() for note in notes]
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes_data, f)

# --- Flet UI functions ---

def open_settings(e, page):
    def set_light_mode(e):
        colors.setLight()
        page.theme_mode = 'light'
        open_settings(e, page)

    def set_dark_mode(e):
        colors.setDark()
        page.theme_mode = 'dark'
        open_settings(e, page)

    page.clean()
    page.add(ft.AppBar(ft.Image(src=colors.LOGO),
                     title=ft.Text('Settings', weight=ft.FontWeight.BOLD, color=colors.TEXT),
                     actions=[ft.IconButton(ft.icons.CLOSE, on_click=lambda e: main(page))],
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))

    with open(SETTINGS_FILE, 'r') as f:
        settings = json.load(f)
    
    page.add(ft.Row([ft.IconButton(ft.icons.LIGHT_MODE, on_click=set_light_mode), ft.Text("Light Mode"),
                     ft.IconButton(ft.icons.DARK_MODE, on_click=set_dark_mode), ft.Text("Dark Mode")]))
    page.add(ft.Divider())
    page.add(ft.Row([ft.Text(f'Current Color Theme is', color=colors.TEXT),
                     ft.Text(colors.COLOR_THEME, weight=ft.FontWeight.BOLD, color=colors.PRIMARY, size=20)]))
    page.add(ft.Row([
        ft.CupertinoButton('Blue', width=page.width / 3 - 13, padding=10, bgcolor='#007bff', color=colors.BTNTEXT,
                          on_click=lambda e: (colors.setBlue(), open_settings(e, page))),
        ft.CupertinoButton('Olive', width=page.width / 3 - 13, padding=10, bgcolor='#661b04', color=colors.BTNTEXT,
                          on_click=lambda e: (colors.setOlive(), open_settings(e, page))),
        ft.CupertinoButton('Sunset', width=page.width / 3 - 13, padding=10, bgcolor='#ff4500', color=colors.BTNTEXT,
                          on_click=lambda e: (colors.setSunset(), open_settings(e, page)))
    ]))

def load_note(note_info, page, notes):
    def save_note(e):
        title = note_title.value
        content = note_content.value
        
        for i, note in enumerate(notes):
            if note.note_id == note_id:
                notes[i] = Note(title, content, note.note_id)
                save_notes(notes)
                
        main(page)
    
    def delete_note_page(note_id):
        for i, note in enumerate(notes):
            if note.note_id == note_id:
                notes.pop(i)
                save_notes(notes)
                
        main(page)
      
    page.clean()
    
    page.add(ft.AppBar(ft.Image(src=colors.LOGO), 
                     title=ft.Text('Notey', weight=ft.FontWeight.BOLD, color=colors.TEXT), 
                     actions=[ft.IconButton(ft.icons.SETTINGS, on_click=lambda e: open_settings(e, page))], 
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
    
    note_title = ft.TextField(note_info.title, label='Title', hint_text='Title')
    note_content = ft.TextField(note_info.content, label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
    note_id = note_info.note_id
    
    page.add(note_title)
    page.add(note_content)
    page.add(ft.Row([
        ft.CupertinoButton('Save', width=page.width / 3 - 13, padding=10,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=save_note), 
        ft.CupertinoButton('Cancel', width=page.width / 3 - 13, padding=10,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: main(page)), 
        ft.CupertinoButton('Delete', width=page.width / 3 - 13, padding=10,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: delete_note_page(note_id))
        ]))
    
def display_notes(page, notes):   
    if not notes:
        page.add(ft.Text('No notes yet'))
        return 
    for note in notes:
        if note.title:
            page.add(ft.Row([
                ft.CupertinoButton(note.title, width=page.width / 3 - 13, padding=10, bgcolor=colors.SECONDARY, color=colors.BTNTEXT, on_click=lambda e, note=note: load_note(note, page, notes)), 
                ft.TextField(note.content, border=ft.InputBorder.NONE, width=page.width / 1.5 - 13, multiline=True, min_lines=1, max_lines=2, 
                             hint_text='No content' if not note.content else None, disabled=True, color=colors.TEXT)
                ]))
        else:
            page.add(ft.Row([
                ft.CupertinoButton('Untitled', width=page.width / 3 -13, padding=10, bgcolor=colors.SECONDARY, color=colors.BTNTEXT, on_click=lambda e, note=note: load_note(note, page, notes)), 
                ft.TextField(note.content, border=ft.InputBorder.NONE, width=page.width / 1.5 - 13, multiline=True, min_lines=1, max_lines=2, 
                             hint_text='No content' if not note.content else None, disabled=True, color=colors.TEXT)
                ]))
        page.add(ft.Divider())
    
def new_note(e, page, notes):
    def save_note(e):
        title = note_title.value
        content = note_content.value
        
        new_note = Note(title, content)
        notes.append(new_note)
        save_notes(notes)
        main(page)
            
    def clear_note(e):
        note_title.value = ''
        note_content.value = ''
        note_title.focus()
        note_content.focus()
        note_title.update()
        note_title.update()
                
    page.clean()
    
    page.add(ft.AppBar(ft.Image(src=colors.LOGO), 
                     title=ft.Text('Notey', weight=ft.FontWeight.BOLD, color=colors.TEXT), 
                     actions=[ft.IconButton(ft.icons.SETTINGS, on_click=lambda e: open_settings(e, page))], 
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
            
    note_title = ft.TextField(label='Title', hint_text='Title')
    note_content = ft.TextField(label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
    
    page.add(note_title)
    page.add(note_content)
    page.add(ft.Row([
        ft.CupertinoButton('Save', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=save_note), 
        ft.CupertinoButton('Cancel', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: main(page)), 
        ft.CupertinoButton('Clear', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=clear_note)
        ]))

# --- Main application function ---

def main(page: ft.Page):
    page.clean()
    page.theme_mode = 'dark' if colors.BG == '#1A1C1E' else 'light'
    page.title = "Notey"
    page.add(ft.AppBar(ft.Image(src=colors.LOGO), 
                     title=ft.Text('Notey', weight=ft.FontWeight.BOLD, color=colors.TEXT), 
                     actions=[ft.IconButton(ft.icons.SETTINGS, on_click=lambda e: open_settings(e, page))], 
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
    page.add(ft.FloatingActionButton(icon=ft.icons.ADD, foreground_color=colors.BTNTEXT, 
                                    on_click=lambda e: new_note(e, page, notes), bgcolor=colors.PRIMARY))
    
    notes = load_notes()
    
    display_notes(page, notes)
    page.update()

ft.app(target=main)