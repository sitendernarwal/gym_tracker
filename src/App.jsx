import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, CheckSquare, Plus, X, ChevronLeft, ChevronRight, History, Trash2, Database } from 'lucide-react';
import Dexie from 'dexie';

// Initialize Database
const db = new Dexie('GymTrackerDB');
db.version(1).stores({
  workouts: 'id, date, exercises',
  tasks: 'id, date, taskList'
});

const GymTaskTracker = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('gym');
  const [workouts, setWorkouts] = useState({});
  const [tasks, setTasks] = useState({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', sets: [] });
  const [newTask, setNewTask] = useState('');
  const [dbStatus, setDbStatus] = useState('Loading...');

  // Load all data from database on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const allWorkouts = await db.workouts.toArray();
      const allTasks = await db.tasks.toArray();
      
      const workoutsObj = {};
      allWorkouts.forEach(item => {
        workoutsObj[item.date] = item.exercises;
      });
      
      const tasksObj = {};
      allTasks.forEach(item => {
        tasksObj[item.date] = item.taskList;
      });
      
      setWorkouts(workoutsObj);
      setTasks(tasksObj);
      setDbStatus('Connected');
      setTimeout(() => setDbStatus(''), 2000);
    } catch (error) {
      console.error('Error loading data:', error);
      setDbStatus('Error loading data');
    }
  };

  const saveWorkoutToDB = async (dateKey, exercises) => {
    try {
      await db.workouts.put({
        id: dateKey,
        date: dateKey,
        exercises: exercises
      });
      setDbStatus('Saved ✓');
      setTimeout(() => setDbStatus(''), 1500);
    } catch (error) {
      console.error('Error saving workout:', error);
      setDbStatus('Save failed');
    }
  };

  const saveTasksToDB = async (dateKey, taskList) => {
    try {
      await db.tasks.put({
        id: dateKey,
        date: dateKey,
        taskList: taskList
      });
      setDbStatus('Saved ✓');
      setTimeout(() => setDbStatus(''), 1500);
    } catch (error) {
      console.error('Error saving tasks:', error);
      setDbStatus('Save failed');
    }
  };

  const deleteWorkoutFromDB = async (dateKey) => {
    try {
      await db.workouts.delete(dateKey);
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const deleteTasksFromDB = async (dateKey) => {
    try {
      await db.tasks.delete(dateKey);
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const addSet = () => {
    setNewExercise({
      ...newExercise,
      sets: [...newExercise.sets, { reps: '', weight: '' }]
    });
  };

  const updateSet = (index, field, value) => {
    const updatedSets = [...newExercise.sets];
    updatedSets[index][field] = value;
    setNewExercise({ ...newExercise, sets: updatedSets });
  };

  const removeSet = (index) => {
    const updatedSets = newExercise.sets.filter((_, i) => i !== index);
    setNewExercise({ ...newExercise, sets: updatedSets });
  };

  const saveExercise = async () => {
    if (newExercise.name && newExercise.sets.length > 0) {
      const dateKey = formatDate(selectedDate);
      const currentWorkouts = workouts[dateKey] || [];
      const updatedWorkouts = [...currentWorkouts, newExercise];
      
      setWorkouts({
        ...workouts,
        [dateKey]: updatedWorkouts
      });
      
      await saveWorkoutToDB(dateKey, updatedWorkouts);
      
      setNewExercise({ name: '', sets: [] });
      setShowAddExercise(false);
    }
  };

  const deleteExercise = async (dateKey, exerciseIndex) => {
    const updatedWorkouts = { ...workouts };
    updatedWorkouts[dateKey] = updatedWorkouts[dateKey].filter((_, i) => i !== exerciseIndex);
    
    if (updatedWorkouts[dateKey].length === 0) {
      delete updatedWorkouts[dateKey];
      await deleteWorkoutFromDB(dateKey);
    } else {
      await saveWorkoutToDB(dateKey, updatedWorkouts[dateKey]);
    }
    
    setWorkouts(updatedWorkouts);
  };

  const addTask = async () => {
    if (newTask.trim()) {
      const dateKey = formatDate(selectedDate);
      const currentTasks = tasks[dateKey] || [];
      const updatedTasks = [...currentTasks, { text: newTask, completed: false }];
      
      setTasks({
        ...tasks,
        [dateKey]: updatedTasks
      });
      
      await saveTasksToDB(dateKey, updatedTasks);
      
      setNewTask('');
      setShowAddTask(false);
    }
  };

  const toggleTask = async (dateKey, taskIndex) => {
    const updatedTasks = { ...tasks };
    updatedTasks[dateKey][taskIndex].completed = !updatedTasks[dateKey][taskIndex].completed;
    setTasks(updatedTasks);
    await saveTasksToDB(dateKey, updatedTasks[dateKey]);
  };

  const deleteTask = async (dateKey, taskIndex) => {
    const updatedTasks = { ...tasks };
    updatedTasks[dateKey] = updatedTasks[dateKey].filter((_, i) => i !== taskIndex);
    
    if (updatedTasks[dateKey].length === 0) {
      delete updatedTasks[dateKey];
      await deleteTasksFromDB(dateKey);
    } else {
      await saveTasksToDB(dateKey, updatedTasks[dateKey]);
    }
    
    setTasks(updatedTasks);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const exportData = async () => {
    try {
      const allWorkouts = await db.workouts.toArray();
      const allTasks = await db.tasks.toArray();
      
      const dataToExport = {
        workouts: allWorkouts,
        tasks: allTasks,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-tracker-backup-${formatDate(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setDbStatus('Exported ✓');
      setTimeout(() => setDbStatus(''), 2000);
    } catch (error) {
      console.error('Export error:', error);
      setDbStatus('Export failed');
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = formatDate(date);
      const isSelected = formatDate(selectedDate) === dateKey;
      const isToday = formatDate(new Date()) === dateKey;
      const hasWorkout = workouts[dateKey]?.length > 0;
      const hasTasks = tasks[dateKey]?.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-12 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all ${
            isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">{day}</span>
          <div className="flex gap-1 mt-0.5">
            {hasWorkout && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`}></div>}
            {hasTasks && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-600'}`}></div>}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  const renderGymContent = () => {
    const dateKey = formatDate(selectedDate);
    const todayWorkouts = workouts[dateKey] || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <button
            onClick={() => setShowAddExercise(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Exercise
          </button>
        </div>

        {todayWorkouts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Dumbbell size={48} className="mx-auto mb-3 opacity-50" />
            <p>No exercises logged for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayWorkouts.map((exercise, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-800 text-lg">{exercise.name}</h4>
                  <button
                    onClick={() => deleteExercise(dateKey, idx)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-2">
                  {exercise.sets.map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold text-gray-600 w-12">Set {setIdx + 1}</span>
                      <span className="text-gray-700">{set.reps} reps</span>
                      <span className="text-gray-400">×</span>
                      <span className="text-gray-700">{set.weight} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add Exercise</h3>
                <button onClick={() => {
                  setShowAddExercise(false);
                  setNewExercise({ name: '', sets: [] });
                }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Exercise name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="space-y-3 mb-4">
                {newExercise.sets.map((set, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-sm font-semibold text-gray-600 w-12">Set {idx + 1}</span>
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <input
                      type="number"
                      placeholder="Weight (kg)"
                      value={set.weight}
                      onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button onClick={() => removeSet(idx)} className="text-red-500 hover:text-red-700">
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addSet}
                className="w-full mb-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                + Add Set
              </button>
              <button
                onClick={saveExercise}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Save Exercise
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTasksContent = () => {
    const dateKey = formatDate(selectedDate);
    const todayTasks = tasks[dateKey] || [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p>No tasks for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md p-4 flex items-center gap-3 group">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(dateKey, idx)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                />
                <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(dateKey, idx)}
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add Task</h3>
                <button onClick={() => {
                  setShowAddTask(false);
                  setNewTask('');
                }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Task description"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={addTask}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-800">Fitness & Task Tracker</h1>
            {dbStatus && (
              <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                <Database size={14} />
                {dbStatus}
              </span>
            )}
          </div>
          <p className="text-gray-600">Track your workouts and daily goals with IndexedDB storage</p>
          <button
            onClick={exportData}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Export Backup
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {renderCalendar()}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('gym')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'gym' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Dumbbell size={20} />
                  Gym
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === 'tasks' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare size={20} />
                  Tasks
                </button>
              </div>

              {activeTab === 'gym' ? renderGymContent() : renderTasksContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymTaskTracker;