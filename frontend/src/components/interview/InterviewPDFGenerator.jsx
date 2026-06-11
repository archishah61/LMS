"use client"
import React from "react";
import { Download } from "lucide-react";
import { useLogInterviewDownloadMutation } from "../../services/Ai/interviewAPI";
import { getStudentToken } from "../../services/CookieService";

/**
 * InterviewPDFGenerator - Component to generate and download interview evaluation PDFs
 * 
 * @param {Object} evaluation - The evaluation data object
 * @param {string} role - The job role of the interview
 * @param {string} category - The category of the interview
 * @param {string} date - Localized date string of the attempt
 * @param {string} fullDateTime - Full date and time of the attempt
 * @param {number} evaluation_result_id - The ID of the evaluation result for logging
 */
const InterviewPDFGenerator = ({ evaluation, role, category, date, fullDateTime, evaluation_result_id, variant = "default", onDownloadSuccess }) => {
    const { access_token } = getStudentToken();
    const [logDownload] = useLogInterviewDownloadMutation();

    const generatePDF = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!evaluation) return;

        // Open window immediately before await to prevent browser popup blockers from stopping it
        const printWindow = window.open("", "_blank");
        
        if (!printWindow) {
            console.error("Popup blocked! Please allow popups for this site.");
            return;
        }

        // Log the download event
        if (evaluation_result_id && access_token) {
            try {
                await logDownload({
                    evaluation_result_id,
                    download_date: new Date().toLocaleString(),
                    access_token
                }).unwrap();
                if (onDownloadSuccess) onDownloadSuccess();
            } catch (err) {
                console.error("Failed to log interview download:", err);
            }
        }

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Interview Evaluation - ${role}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #fff;
            padding: 40px;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
          }
          
          .header {
            border-bottom: 2px solid #00BB6E;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 5px;
          }
          
          .header p {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .meta-info {
            text-align: right;
          }
          
          .score-badge {
            background: #00BB6E;
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            text-align: center;
          }
          
          .score-value {
            font-size: 24px;
            font-weight: 900;
            display: block;
            line-height: 1;
          }
          
          .score-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.9;
          }
          
          .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
          }
          
          .summary-card {
            background: #f0fdf4;
            border-color: #dcfce7;
            color: #166534;
          }
          
          .question-card {
            border-left: 4px solid #00BB6E;
            page-break-inside: avoid;
          }
          
          .label {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
            display: block;
          }
          
          .content {
            font-size: 11px;
            margin-bottom: 12px;
            color: #334155;
            white-space: pre-wrap;
          }
          
          .feedback-box {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
          }
          
          .feedback-text {
            color: #92400e;
            font-style: italic;
            font-size: 11px;
          }
          
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
            font-weight: 600;
          }

          @media print {
            body { padding: 20px; }
            .question-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Interview Intel</h1>
            <p>${role} • ${category}</p>
          </div>
          <div class="meta-info">
             <div class="score-badge">
               <span class="score-value">${evaluation.overallScore}%</span>
               <span class="score-label">Overall Score</span>
             </div>
          </div>
        </div>

        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">
          <span>Attempted: ${fullDateTime || date}</span>
          <span>Queekies Interview Coach</span>
        </div>

        <div class="section">
          <div class="section-title">Executive Performance Analysis</div>
          <div class="card summary-card">
            <div class="content" style="font-size: 12px; color: #14532d;">${evaluation.overallAssessment}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detailed Question Breakdown</div>
          ${evaluation.questionEvaluations.map((q, i) => `
            <div class="card question-card">
              <span class="label">Question ${i + 1}</span>
              <div class="content" style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 20px;">"${q.question}"</div>
              
              <div class="grid">
                <div>
                  <span class="label" style="color: #64748b;">Your Delivery</span>
                  <div class="content">${q.userAnswer}</div>
                </div>
                <div>
                  <span class="label" style="color: #059669;">Strategic Benchmark</span>
                  <div class="content">${q.originalAnswer}</div>
                </div>
              </div>

              ${q.suggestedImprovement || q.feedback ? `
                <div class="feedback-box">
                  <span class="label" style="color: #b45309;">Coach Strategy & Actionable Tips</span>
                  <div class="feedback-text">${(q.feedback ? q.feedback + '\n\n' : '') + (q.suggestedImprovement || '')}</div>
                </div>
              ` : ''}
              
              <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
                <div style="background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; color: #475569;">
                  ACCURACY SCORE: ${q.score || 0}%
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <span>Queekies • Interactive Preparation Hub</span>
          <span>Downloaded on: ${new Date().toLocaleString()}</span>
        </div>
      </body>
      </html>
    `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    };

    if (variant === "icon") {
        return (
            <button
                onClick={generatePDF}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary"
                title="Download Report PDF"
            >
                <Download className="w-4 h-4" />
            </button>
        );
    }

    return (
        <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-3 py-2 bg-white text-primary text-[10px] md:text-[11px] font-bold rounded-md shadow-sm uppercase tracking-widest border border-primary/20 hover:bg-primary/5 transition-all"
        >
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">Download Report</span>
            <span className="xs:hidden">PDF</span>
        </button>
    );
};

export default InterviewPDFGenerator;
