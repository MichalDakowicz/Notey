import flet as ft

import json
import uuid
import os
import webbrowser

import dropbox

# --- App constants and data structures ---
NOTES_FILE = 'notes.json'
SETTINGS_FILE = 'settings.json'

if not os.path.exists(NOTES_FILE):
    with open(NOTES_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump({'use_dropbox': False, 'dropbox_token': ''}, f)

class Colors:
    def __init__(self):
        self.COLOR_THEME = 'Blue'
        self.BG = '#1A1C1E'
        self.BGACCENT = '#151618'
        self.TEXT = '#ffffff'
        self.BTNTEXT = '#ffffff'
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
        self.BTNTEXT = self.TEXT
    
    def setOlive(self):
        self.COLOR_THEME = 'Olive'
        self.PRIMARY = '#661b04'
        self.SECONDARY = '#8a2e00'
        self.BTNTEXT = '#ffffff'
        
    def setSunset(self):
        self.COLOR_THEME = 'Sunset'
        self.PRIMARY = '#ff4500'
        self.SECONDARY = '#ff8c00'
        self.BTNTEXT = self.TEXT
        
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
    """Load notes from Dropbox or local file based on settings."""
    with open(SETTINGS_FILE, 'r') as f:
        settings = json.load(f)

    if settings.get('use_dropbox', False) and settings.get('dropbox_token'): 
        try:
            dbx = dropbox.Dropbox(settings['dropbox_token'])
            _, res = dbx.files_download(f'/{NOTES_FILE}')
            notes_data = json.loads(res.content)
            return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]
        except Exception as e:
            print(f"Error loading from Dropbox: {e}")
            # create the file and upload the contents of notes.json if it doesn't exist on dropbox
            if 'not_found' in str(e):
                dbx.files_upload(json.dumps([]).encode(), f'/{NOTES_FILE}', mode=dropbox.files.WriteMode.add)    
            # Fallback to loading from local file if Dropbox fails
            with open(NOTES_FILE, 'r') as f:
                notes_data = json.load(f)
                return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]
    else:
        with open(NOTES_FILE, 'r') as f:
            notes_data = json.load(f)
            return [Note(n['title'], n['content'], n['note_id']) for n in notes_data]


def save_notes(notes):
    """Save notes to Dropbox or local file based on settings."""
    with open(SETTINGS_FILE, 'r') as f:
        settings = json.load(f)

    notes_data = [note.to_dict() for note in notes]
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes_data, f)

    if settings.get('use_dropbox', False) and settings.get('dropbox_token'):
        try:
            dbx = dropbox.Dropbox(settings['dropbox_token'])
            dbx.files_upload(json.dumps(notes_data).encode(), f'/{NOTES_FILE}', mode=dropbox.files.WriteMode.overwrite)
        except Exception as e:
            print(f"Error saving to Dropbox: {e}")

# --- Flet UI functions ---

def open_settings(e, page):
    def save_settings(e):
        settings['use_dropbox'] = use_dropbox_switch.value
        settings['dropbox_token'] = dropbox_token_field.value
        
        dbx = dropbox.Dropbox(settings['dropbox_token'])
        dbx.files_upload(json.dumps([]).encode(), f'/{NOTES_FILE}', mode=dropbox.files.WriteMode.add)
        
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f)
        
        # Reload notes to reflect potential Dropbox sync
        page.snack_bar = ft.SnackBar(ft.Text("Settings saved!"), open=True)
        page.update()
        main(page)  

    def set_light_mode(e):
        colors.setLight()
        page.theme_mode = 'light'
        open_settings(e, page)

    def set_dark_mode(e):
        colors.setDark()
        page.theme_mode = 'dark'
        open_settings(e, page)
        
    def change_dropbox(e):
        def save_dropbox_token(e):
            token = auth_token.value
            try:
                oauth_result = auth_flow.finish(token.strip())
                settings['dropbox_token'] = oauth_result.access_token
                dropbox_token_field.value = settings['dropbox_token']
                with open(SETTINGS_FILE, 'w') as f:
                    json.dump(settings, f)
                page.snack_bar = ft.SnackBar(ft.Text("Dropbox connected!"), open=True)
            except Exception as ex:
                print(f"Error in Dropbox authentication: {ex}")
                page.snack_bar = ft.SnackBar(ft.Text(f"Invalid token: {ex}"), open=True)
            page.update()
        
        dropbox_token_field.disabled = not use_dropbox_switch.value
        if not dropbox_token_field.value and use_dropbox_switch.value:
            page.update()
            auth_flow = dropbox.DropboxOAuth2FlowNoRedirect('6uwbnzmdivfyrjr', '80u4sxq2n3bjor3', token_access_type='offline')
            authorize_url = auth_flow.start()
            webbrowser.open_new_tab(authorize_url)
            
            auth_token = ft.TextField(label='Enter Dropbox Access Token', hint_text='Access Token', password=True, can_reveal_password=True)
            page.add(auth_token, ft.ElevatedButton('Save Access Token', on_click=save_dropbox_token))
        dropbox_token_field.update()

    page.clean()
    page.add(ft.AppBar(ft.Image(src=f"logo-transparent.png"),
                     title=ft.Text('Settings', weight=ft.FontWeight.BOLD, color=colors.TEXT),
                     actions=[ft.IconButton(ft.icons.CLOSE, on_click=lambda e: main(page))],
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))

    with open(SETTINGS_FILE, 'r') as f:
        settings = json.load(f)

    use_dropbox_switch = ft.Switch(value=settings.get('use_dropbox', False), label="Use Dropbox", on_change=change_dropbox)
    dropbox_token_field = ft.TextField(value=settings.get('dropbox_token', ''), label="Dropbox Access Token", password=True,
                                       disabled=not use_dropbox_switch.value, can_reveal_password=True)
    
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

    page.add(use_dropbox_switch)
    page.add(dropbox_token_field)
    page.add(ft.ElevatedButton("Save Settings", on_click=save_settings))

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
    note_title = ft.TextField(note_info.title, label='Title', hint_text='Title')
    note_content = ft.TextField(note_info.content, label='Note', hint_text='Note', multiline=True, min_lines=3, max_lines=5)
    note_id = note_info.note_id
    
    page.add(note_title)
    page.add(note_content)
    page.add(ft.Row([
        ft.CupertinoButton('Save', width=page.width / 3 - 13,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=save_note), 
        ft.CupertinoButton('Cancel', width=page.width / 3 - 13,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: main(page)), 
        ft.CupertinoButton('Delete', width=page.width / 3 - 13,  bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: delete_note_page(note_id))
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
    page.add(ft.Row([
        ft.CupertinoButton('Save', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=save_note), 
        ft.CupertinoButton('Cancel', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=lambda e: main(page)), 
        ft.CupertinoButton('Delete', width=page.width / 3 - 13, padding=10, bgcolor=colors.PRIMARY, color=colors.BTNTEXT, on_click=delete_note)
        ]))

# --- Main application function ---

def main(page: ft.Page):
    page.clean()
    
    page.title = "Notey"
    page.add(ft.AppBar(ft.Image(src=f"logo-transparent.png"), 
                     title=ft.Text('Notey', weight=ft.FontWeight.BOLD, color=colors.TEXT), 
                     actions=[ft.IconButton(ft.icons.SETTINGS, on_click=lambda e: open_settings(e, page))], 
                     bgcolor=colors.BGACCENT, color=colors.TEXT, elevation=0))
    page.add(ft.FloatingActionButton(icon=ft.icons.ADD, foreground_color=colors.BTNTEXT, 
                                    on_click=lambda e: new_note(e, page, notes), bgcolor=colors.PRIMARY))
    page.add(ft.Stack())
    
    notes = load_notes()
    
    display_notes(page, notes)
    page.update()

ft.app(target=main)