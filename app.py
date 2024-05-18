from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.label import Label
from kivy.uix.scrollview import ScrollView
from kivy.uix.floatlayout import FloatLayout

from kivy.uix.behaviors import TouchRippleBehavior
from kivy.lang import Builder
from kivy.utils import get_color_from_hex
from kivy.metrics import dp

import json
import uuid

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

class NoteyApp(App):
    def __init__(self):
        super().__init__()
        self.notes = []
        self.load_notes()

    def build(self):
        root = BoxLayout(orientation='horizontal')

        # Left side: Note list
        self.note_list = GridLayout(cols=1, size_hint_x=0.3, spacing=5, padding=10)
        root.add_widget(ScrollView(do_scroll_x=False, do_scroll_y=True, bar_width=8, 
                        bar_color=[0.7, 0.7, 0.7, 1], 
                        bar_inactive_color=[0.7, 0.7, 0.7, 0.5], 
                        effect_cls='ScrollEffect', bar_margin=10))
        root.children[0].add_widget(self.note_list)

        # Right side: Container for button and editor
        right_side = FloatLayout(size_hint_x=0.7)
        root.add_widget(right_side)

        # New note button
        self.new_note_button = Button(text="New Note", size_hint_y=None, height=40, 
                                     pos_hint={'x': 0, 'y': 0}, on_press=self.show_note_editor)
        right_side.add_widget(self.new_note_button)

        # Note editor (initially hidden)
        self.note_editor = BoxLayout(orientation='vertical', size_hint=(0.9, 0.9), 
                                     pos_hint={'x': 0.05, 'y': 0.05}, padding=10, opacity=0, width=dp(300))
        self.title_input = TextInput(hint_text="Title", size_hint_y=None, height=40)
        self.content_input = TextInput(hint_text="Take a note...", multiline=True)
        self.save_button = Button(text="Save", size_hint_y=None, height=40, on_press=self.save_note)
        self.delete_button = Button(text="Delete", size_hint_y=None, height=40, on_press=self.delete_note)
        self.close_button = Button(text="Close", size_hint_y=None, height=40, on_press=self.close_note)
        self.note_editor.add_widget(self.title_input)
        self.note_editor.add_widget(self.content_input)
        self.note_editor.add_widget(self.save_button)
        self.note_editor.add_widget(self.delete_button)
        self.note_editor.add_widget(self.close_button)
        right_side.add_widget(self.note_editor)

        # Populate note list
        self.refresh_note_list()

        return root

    def show_note_editor(self, instance):
        self.new_note_button.opacity = 0
        self.note_editor.opacity = 1
        self.title_input.text = ""
        self.content_input.text = ""
        self.save_button.text = "Save"

    def refresh_note_list(self):
        self.note_list.clear_widgets()
        for note in self.notes:
            button = Button(text=note.title, size_hint_y=None, height=40,
                            on_press=lambda instance, n=note: self.load_note(n))
            self.note_list.add_widget(button)

    def save_note(self, instance):
        title = self.title_input.text
        content = self.content_input.text

        if self.save_button.text == "Save":
            new_note = Note(title, content)
            self.notes.append(new_note)
            self.save_notes()
            self.refresh_note_list()
        else:
            for i, note in enumerate(self.notes):
                if note.note_id == self.current_note_id:
                    self.notes[i] = Note(title, content, note.note_id)
                    self.save_notes()
                    self.refresh_note_list()
                    break

        self.note_editor.opacity = 0
        self.title_input.text = ""
        self.content_input.text = ""
        self.new_note_button.opacity = 1
    
    def delete_note(self, instance):
        for i, note in enumerate(self.notes):
            try:
                if note.note_id == self.current_note_id:
                    del self.notes[i]
                    self.save_notes()
                    self.refresh_note_list()
                    self.note_editor.opacity = 0
                    break
            except AttributeError:
                self.title_input.text = ""
                self.content_input.text = ""
                break
    
    def close_note(self, instance):
        self.note_editor.opacity = 0
        self.title_input.text = ""
        self.content_input.text = ""
        self.new_note_button.opacity = 1

    def load_note(self, note):
        self.note_editor.opacity = 1
        self.title_input.text = note.title
        self.content_input.text = note.content
        self.save_button.text = "Update"
        self.current_note_id = note.note_id
        self.new_note_button.opacity = 0

    def load_notes(self):
        try:
            with open('notes.json', 'r') as f:
                notes_data = json.load(f)
                self.notes = [Note(n['title'], n['content'], n['note_id']) for n in notes_data]
        except FileNotFoundError:
            self.notes = []

    def save_notes(self):
        with open('notes.json', 'w') as f:
            json.dump([note.to_dict() for note in self.notes], f)

if __name__ == '__main__':
    NoteyApp().run()