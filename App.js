import React, { useState, useEffect } from 'react';
import { View, FlatList, ScrollView, Share, Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider, 
         Appbar, 
         TextInput, 
         Button, 
         List, 
         FAB,
         Searchbar,
         Chip,
         Modal,
         Portal,
         Menu,
         DefaultTheme,
         IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { db, auth } from './firebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const HighlightedText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <Text>{text}</Text>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <Text>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <Text key={i} style={{ backgroundColor: 'yellow' }}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

const App = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [currentCategory, setCurrentCategory] = useState('General');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCodeSnippet, setIsCodeSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [categories, setCategories] = useState(['General', 'JavaScript', 'Python', 'React', 'Data Structures', 'Algorithms']);
  const [tags, setTags] = useState([]);
  const [currentTags, setCurrentTags] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [user, setUser] = useState(null);
  const [recording, setRecording] = useState();
  const [recordings, setRecordings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadNotes();
    loadCategories();
    loadTags();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        syncNotesWithCloud();
      }
    });

    return () => {
      unsubscribe();
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      if (storedNotes !== null) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      if (storedCategories !== null) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const storedTags = await AsyncStorage.getItem('tags');
      if (storedTags !== null) {
        setTags(JSON.parse(storedTags));
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const saveNotes = async (updatedNotes) => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { notes: updatedNotes }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const saveCategories = async (updatedCategories) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  };

  const saveTags = async (updatedTags) => {
    try {
      await AsyncStorage.setItem('tags', JSON.stringify(updatedTags));
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  };

  const addNote = () => {
    if (currentNote.trim() !== '') {
      const newNote = {
        id: Date.now().toString(),
        content: currentNote,
        category: currentCategory,
        tags: currentTags,
        isCode: isCodeSnippet,
        language: isCodeSnippet ? codeLanguage : null,
        timestamp: new Date().toISOString(),
      };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      setCurrentNote('');
      setIsCodeSnippet(false);
      setCodeLanguage('javascript');
      setCurrentTags([]);
    }
  };

  const updateNote = () => {
    if (currentNote.trim() !== '' && editingNoteId) {
      const updatedNotes = notes.map(note => 
        note.id === editingNoteId ? {
          ...note,
          content: currentNote,
          category: currentCategory,
          tags: currentTags,
          isCode: isCodeSnippet,
          language: isCodeSnippet ? codeLanguage : null,
          timestamp: new Date().toISOString(),
        } : note
      );
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      setCurrentNote('');
      setEditingNoteId(null);
      setIsCodeSnippet(false);
      setCodeLanguage('javascript');
      setCurrentTags([]);
    }
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const editNote = (note) => {
    setCurrentNote(note.content);
    setCurrentCategory(note.category);
    setEditingNoteId(note.id);
    setIsCodeSnippet(note.isCode);
    setCodeLanguage(note.language || 'javascript');
    setCurrentTags(note.tags || []);
    setModalVisible(true);
  };

  const addCategory = () => {
    if (newCategory.trim() !== '' && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      saveCategories(updatedCategories);
      setNewCategory('');
    }
  };

  const addTag = () => {
    if (newTag.trim() !== '' && !tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      saveTags(updatedTags);
      setNewTag('');
    }
  };

  const toggleTag = (tag) => {
    if (currentTags.includes(tag)) {
      setCurrentTags(currentTags.filter(t => t !== tag));
    } else {
      setCurrentTags([...currentTags, tag]);
    }
  };

  const filteredNotes = notes.filter(note => 
    (note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const renderNoteItem = ({ item }) => (
    <List.Item
      title={item.category}
      description={() => (
        <View>
          <ScrollView style={{ maxHeight: 100, ...(item.isCode ? { backgroundColor: '#f0f0f0', padding: 10 } : {}) }}>
            <HighlightedText 
              text={item.content || ''}
              highlight={searchQuery}
            />
          </ScrollView>
          <Text style={{ fontSize: 12, color: '#888' }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
            {(item.tags || []).map(tag => (
              <Chip key={tag} style={{ marginRight: 5, marginBottom: 5 }}>{tag}</Chip>
            ))}
          </View>
        </View>
      )}
      right={() => (
        <View style={{ flexDirection: 'row' }}>
          <Button onPress={() => editNote(item)}>Edit</Button>
          <Button onPress={() => deleteNote(item.id)}>Delete</Button>
        </View>
      )}
    />
  );

  const exportNotes = async () => {
    const notesString = JSON.stringify(notes);
    const path = FileSystem.documentDirectory + 'notes_backup.json';
    await FileSystem.writeAsStringAsync(path, notesString);
    await Share.share({
      url: path,
      message: 'Here is your notes backup file.',
    });
  };

  const importNotes = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.type === 'success') {
        const fileContents = await FileSystem.readAsStringAsync(result.uri);
        const importedNotes = JSON.parse(fileContents);
        setNotes(importedNotes);
        saveNotes(importedNotes);
      }
    } catch (error) {
      console.error('Error importing notes:', error);
    }
  };

  const syncNotesWithCloud = async () => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudNotes = docSnap.data().notes;
        setNotes(cloudNotes);
        await AsyncStorage.setItem('notes', JSON.stringify(cloudNotes));
      } else {
        await saveNotes(notes);
      }
    }
  };

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        setRecording(recording);
      } else {
        setMessage("Please grant permission to app to access microphone");
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  const stopRecording = async () => {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    let updatedRecordings = [...recordings];
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    updatedRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: recording.getURI()
    });
    setRecordings(updatedRecordings);
  }

  const getDurationFormatted = (millis) => {
    const minutes = millis / 1000 / 60;
    const minutesDisplay = Math.floor(minutes);
    const seconds = Math.round((minutes - minutesDisplay) * 60);
    return `${minutesDisplay}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const getRecordingLines = () => {
    return recordings.map((recordingLine, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text style={styles.fill}>Recording {index + 1} - {recordingLine.duration}</Text>
          <Button onPress={() => recordingLine.sound.replayAsync()} title="Play"></Button>
        </View>
      );
    });
  }

  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="Programming Notes" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action icon="menu" onPress={() => setMenuVisible(true)} />
            }
          >
            <Menu.Item onPress={exportNotes} title="Export Notes" />
            <Menu.Item onPress={importNotes} title="Import Notes" />
            {user ? (
              <Menu.Item onPress={signOut} title="Sign Out" />
            ) : (
              <Menu.Item onPress={signIn} title="Sign In" />
            )}
          </Menu>
        </Appbar.Header>
        
        <Searchbar
          placeholder="Search notes"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ margin: 16 }}
        />

        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteItem}
        />

        <FAB
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
          }}
          icon="plus"
          onPress={() => {
            setCurrentNote('');
            setEditingNoteId(null);
            setModalVisible(true);
          }}
        />

        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20 }}>
            <ScrollView>
              <TextInput
                label="Note content"
                value={currentNote}
                onChangeText={setCurrentNote}
                mode="outlined"
                multiline
              />
              <IconButton
                icon={recording ? "stop" : "microphone"}
                size={24}
                onPress={recording ? stopRecording : startRecording}
                style={{ alignSelf: 'flex-end' }}
              />
              {getRecordingLines()}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    selected={currentCategory === category}
                    onPress={() => setCurrentCategory(category)}
                    style={{ marginRight: 5, marginBottom: 5 }}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
              <TextInput
                label="New Category"
                value={newCategory}
                onChangeText={setNewCategory}
                mode="outlined"
                style={{ marginTop: 10 }}
              />
              <Button onPress={addCategory}>Add Category</Button>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    selected={currentTags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                    style={{ marginRight: 5, marginBottom: 5 }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
              <TextInput
                label="New Tag"
                value={newTag}
                onChangeText={setNewTag}
                mode="outlined"
                style={{ marginTop: 10 }}
              />
              <Button onPress={addTag}>Add Tag</Button>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Chip
                  selected={isCodeSnippet}
                  onPress={() => setIsCodeSnippet(!isCodeSnippet)}
                >
                  Code Snippet
                </Chip>
                {isCodeSnippet && (
                  <TextInput
                    label="Language"
                    value={codeLanguage}
                    onChangeText={setCodeLanguage}
                    mode="outlined"
                    style={{ flex: 1, marginLeft: 10 }}
                  />
                )}
              </View>
              <Button 
                mode="contained" 
                onPress={() => {
                  editingNoteId ? updateNote() : addNote();
                  setModalVisible(false);
                }}
                style={{ marginTop: 20 }}
              >
                {editingNoteId ? 'Update Note' : 'Add Note'}
              </Button>
            </ScrollView>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  fill: {
    flex: 1,
    margin: 16
  },
  button: {
    margin: 16
  }
});

export default App;