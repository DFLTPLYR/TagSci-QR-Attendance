import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export default function TimetableManager() {
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    subjectName: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const createTimetableEntry = useMutation(api.timetables.createTimetableEntry);
  const updateTimetableEntry = useMutation(api.timetables.updateTimetableEntry);
  const deleteTimetableEntry = useMutation(api.timetables.deleteTimetableEntry);
  const timetables = useQuery(api.timetables.getAllTimetables);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const gradeLevels = ['Grade 11', 'Grade 12'];
  const strands = ['STEM', 'HUMSS', 'ABM', 'A&D'];
  
  // Updated sections list according to the correct structure
  const sectionsByGradeAndStrand = {
    'Grade 11': {
      'STEM': ['Ampersand', 'Epsilon', 'Caret', 'Obelus', 'Tilde', 'Vinculum'],
      'HUMSS': ['Antonio Luna', 'Gregorio Del Pilar', 'Jacinto Zamora', 'Jose Burgos', 'Mariano Gomez', 'Melchora Aquino'],
      'ABM': ['Andrew Tan', 'Cecilio Pedro', 'Socorro Ramos'],
      'A&D': ['BenCab']
    },
    'Grade 12': {
      'STEM': ['Zirconium', 'Chromium', 'Gadolinium', 'Titanium', 'Platinum', 'Vanadium'],
      'HUMSS': ['Andres Bonifacio', 'Apolinario Mabini', 'Manuel Quezon', 'Isaac Tolentino', 'Jose Rizal'],
      'ABM': ['Henry Sy', 'Mariano Que', 'Jaime Zobel'],
      'A&D': ['Roberto Ong']
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId || !formData.subjectId || !formData.subjectName || !formData.startTime || !formData.endTime || !formData.dayOfWeek) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (editingId) {
        await updateTimetableEntry({
          entryId: editingId as Id<"timetables">,
          subjectName: formData.subjectName,
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
        toast.success("Timetable entry updated successfully!");
        setEditingId(null);
      } else {
        await createTimetableEntry(formData);
        toast.success("Timetable entry created successfully!");
      }
      
      setFormData({
        classId: '',
        subjectId: '',
        subjectName: '',
        startTime: '',
        endTime: '',
        dayOfWeek: '',
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to save timetable entry");
    }
  };

  const handleEdit = (entry: any) => {
    setFormData({
      classId: entry.classId,
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      startTime: entry.startTime,
      endTime: entry.endTime,
      dayOfWeek: entry.dayOfWeek,
    });
    setEditingId(entry._id);
  };

  const handleDelete = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this timetable entry?")) {
      try {
        await deleteTimetableEntry({ entryId: entryId as Id<"timetables"> });
        toast.success("Timetable entry deleted successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete timetable entry");
      }
    }
  };

  const handleReset = () => {
    setFormData({
      classId: '',
      subjectId: '',
      subjectName: '',
      startTime: '',
      endTime: '',
      dayOfWeek: '',
    });
    setEditingId(null);
  };

  // Generate class IDs from grade levels, strands, and sections
  const generateClassIds = () => {
    const classIds = [];
    for (const grade of gradeLevels) {
      for (const strand of strands) {
        const sections = sectionsByGradeAndStrand[grade as keyof typeof sectionsByGradeAndStrand][strand as keyof typeof sectionsByGradeAndStrand['Grade 11']];
        for (const section of sections) {
          classIds.push(`${grade} ${strand} - ${section}`);
        }
      }
    }
    return classIds;
  };

  const classIds = generateClassIds();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">TIMETABLE MANAGER</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">TIMETABLE MANAGEMENT</h1>
            <p className="text-lg">Manage class schedules and subject timings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">
                {editingId ? 'EDIT TIMETABLE ENTRY' : 'ADD TIMETABLE ENTRY'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">CLASS</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={!!editingId}
                  >
                    <option value="">Select Class</option>
                    {classIds.map(classId => (
                      <option key={classId} value={classId}>{classId}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">SUBJECT ID</label>
                  <input
                    type="text"
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g., MATH101, ENG102"
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">SUBJECT NAME</label>
                  <input
                    type="text"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g., Mathematics, English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">DAY OF WEEK</label>
                  <select
                    name="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={!!editingId}
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">START TIME</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">END TIME</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                  >
                    {editingId ? 'UPDATE ENTRY' : 'ADD ENTRY'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors font-black"
                  >
                    {editingId ? 'CANCEL' : 'RESET'}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">TIMETABLE PREVIEW</h2>
              
              <div className="space-y-4">
                {daysOfWeek.map(day => {
                  const dayEntries = timetables?.filter(entry => entry.dayOfWeek === day) || [];
                  return (
                    <div key={day} className="border-2 border-gray-300 p-3">
                      <h3 className="font-black text-lg mb-2">{day}</h3>
                      {dayEntries.length > 0 ? (
                        <div className="space-y-1">
                          {dayEntries
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map(entry => (
                              <div key={entry._id} className="text-sm bg-gray-100 p-2 rounded">
                                <strong>{entry.subjectName}</strong> ({entry.subjectId})
                                <br />
                                {entry.startTime} - {entry.endTime}
                                <br />
                                <span className="text-gray-600">{entry.classId}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No classes scheduled</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timetable List */}
          <div className="mt-8 border-4 border-black">
            <div className="bg-black text-white p-4">
              <h2 className="text-xl font-black">ALL TIMETABLE ENTRIES ({timetables?.length || 0})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-black">
                  <tr>
                    <th className="text-left p-4 font-black">CLASS</th>
                    <th className="text-left p-4 font-black">SUBJECT</th>
                    <th className="text-left p-4 font-black">DAY</th>
                    <th className="text-left p-4 font-black">TIME</th>
                    <th className="text-left p-4 font-black">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables && timetables.length > 0 ? (
                    timetables.map((entry, index) => (
                      <tr key={entry._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="p-4 font-bold">{entry.classId}</td>
                        <td className="p-4">{entry.subjectName} ({entry.subjectId})</td>
                        <td className="p-4">{entry.dayOfWeek}</td>
                        <td className="p-4">{entry.startTime} - {entry.endTime}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="px-3 py-1 bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors mr-2"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="px-3 py-1 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No timetable entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
