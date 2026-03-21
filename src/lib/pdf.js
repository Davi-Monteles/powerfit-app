import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateWorkoutPDF(workout, studentName = '') {
  const doc = new jsPDF();
  
  // colors
  const orange = [255, 107, 53];
  const blue = [30, 58, 95];
  const gray = [100, 116, 139];
  
  // Header bar
  doc.setFillColor(...orange);
  doc.rect(0, 0, 210, 32, 'F');
  
  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('⚡ PowerFit', 14, 20);
  
  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('pt-BR'), 196, 20, { align: 'right' });
  
  // Workout Name
  doc.setTextColor(...blue);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(workout.name || 'Treino', 14, 48);
  
  // Student Name + Description
  let yPos = 55;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  if (studentName) {
    doc.text(`Aluno: ${studentName}`, 14, yPos);
    yPos += 6;
  }
  if (workout.description) {
    doc.text(workout.description, 14, yPos);
    yPos += 6;
  }
  if (workout.category) {
    doc.text(`Categoria: ${workout.category}`, 14, yPos);
    yPos += 6;
  }
  
  yPos += 6;
  
  // Exercises table
  if (workout.exercises?.length > 0) {
    const tableData = workout.exercises.map((ex, i) => [
      `${i + 1}`,
      ex.name,
      `${ex.sets}`,
      `${ex.reps}`,
      ex.weight ? `${ex.weight} kg` : '—',
      ex.rest ? `${ex.rest}s` : '—',
      ex.notes || '',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Exercício', 'Séries', 'Reps', 'Peso', 'Descanso', 'Obs']],
      body: tableData,
      headStyles: {
        fillColor: orange,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 22 },
        6: { cellWidth: 'auto' },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
      },
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...blue);
  doc.rect(0, pageHeight - 16, 210, 16, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PowerFit - Gestão de Treinos para Personal Trainers', 105, pageHeight - 6, { align: 'center' });
  
  // Save
  const fileName = `treino_${(workout.name || 'powerfit').replace(/\s+/g, '_').toLowerCase()}.pdf`;
  doc.save(fileName);
}
