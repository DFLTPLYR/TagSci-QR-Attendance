import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

export default function GenerateQR() {
  const [formData, setFormData] = useState({
    fullName: '',
    gradeLevel: '',
    strand: '',
    section: '',
    lrnNumber: '',
  });
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const createStudent = useMutation(api.students.createStudent);

  const gradeLevels = ['Grade 11', 'Grade 12'];
  const strands = ['STEM', 'HUMSS', 'ABM', 'A&D'];
  const sections = ['Titanium', 'Zirconium', 'Chromium', 'Platinum', 'Gadolinium', 'Vanadium', 'Ampersand', 'Epsilon', 'Obelus', 'Tilde', 'Vinculum', 'Caret'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.gradeLevel || !formData.strand || !formData.section || !formData.lrnNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    const qrData = JSON.stringify(formData);
    
    try {
      await createStudent(formData);
      
      setGeneratedQR(qrData);
      toast.success("Student QR code generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create student");
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      gradeLevel: '',
      strand: '',
      section: '',
      lrnNumber: '',
    });
    setGeneratedQR(null);
  };

  const downloadQR = () => {
    const svg = document.querySelector('#qr-code svg') as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.fullName.replace(/\s+/g, '_')}_QR.png`;
        a.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b-2 border-black">
        <Link to="/dashboard" className="text-lg font-bold hover:underline">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-lg font-bold">GENERATE QR IDS</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">QR CODE GENERATOR</h1>
            <p className="text-lg">Create QR codes for student identification</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">STUDENT INFORMATION</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">FULL NAME</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">GRADE LEVEL</label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Grade Level</option>
                    {gradeLevels.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">STRAND</label>
                  <select
                    name="strand"
                    value={formData.strand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Strand</option>
                    {strands.map(strand => (
                      <option key={strand} value={strand}>{strand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">SECTION</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">LRN NUMBER</label>
                  <input
                    type="text"
                    name="lrnNumber"
                    value={formData.lrnNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Enter LRN number"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                  >
                    GENERATE QR
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors font-black"
                  >
                    RESET
                  </button>
                </div>
              </form>
            </div>

            {/* QR Code Display */}
            <div className="border-4 border-black p-6">
              <h2 className="text-2xl font-black mb-6">GENERATED QR CODE</h2>
              
              {generatedQR ? (
                <div className="text-center">
                  <div id="qr-code" className="mb-6 flex justify-center">
                    <QRCodeSVG
                      value={generatedQR}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  
                  <div className="text-left mb-6 p-4 bg-gray-100 border-2 border-black">
                    <h3 className="font-black mb-2">STUDENT DETAILS:</h3>
                    <p><strong>Name:</strong> {formData.fullName}</p>
                    <p><strong>Grade:</strong> {formData.gradeLevel}</p>
                    <p><strong>Strand:</strong> {formData.strand}</p>
                    <p><strong>Section:</strong> {formData.section}</p>
                    <p><strong>LRN:</strong> {formData.lrnNumber}</p>
                  </div>
                  
                  <button
                    onClick={downloadQR}
                    className="w-full px-6 py-3 bg-black text-white font-black hover:bg-gray-800 transition-colors"
                  >
                    DOWNLOAD QR CODE
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-16">
                  <div className="text-6xl mb-4">📱</div>
                  <p>Fill out the form to generate a QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
