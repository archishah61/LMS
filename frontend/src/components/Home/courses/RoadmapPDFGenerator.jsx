"use client"
import { Download } from "lucide-react"

const RoadmapPDFGenerator = ({ finalRoadmap }) => {

   const generatePDF = () => {
      // ✅ If PDF URL already exists → download directly
      if (finalRoadmap?.pdfUrl) {
         // const link = document.createElement("a");
         // link.href = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${finalRoadmap.pdfUrl}`;
         // link.download = `${finalRoadmap.goal || "LearningPathRoadMap"}.pdf`; // optional filename
         // document.body.appendChild(link);
         // link.click();
         // document.body.removeChild(link);

         const pdfUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${finalRoadmap?.pdfUrl}`;

         // Open PDF in new tab
         window.open(pdfUrl, "_blank");
         return;
      }

      if (!finalRoadmap || !finalRoadmap.roadmap) {
         alert("No roadmap data available to download.");
         return;
      }

      const roadmap = finalRoadmap.roadmap;
      const nextSteps = finalRoadmap.nextSteps;

      // Create a new window for PDF content
      const printWindow = window.open("", "_blank");

      // Colors based on tailwind config
      // Primary: #00BB6E
      // Text Dark (Forest): #002322
      // Light BG (LightGreen): #F0FBF6

      // Generate HTML content for PDF
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${finalRoadmap.goal} Roadmap</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background: #fff;
            padding: 40px;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
          }
          
          .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header h1 {
            color: #002322; /* forestGreen */
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p { color: #00BB6E; /* primary */ font-size: 12px; font-weight: 600; }
          .header-meta { color: #6b7280; font-size: 10px; }

          .section { margin-bottom: 20px; page-break-inside: avoid; }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #002322; /* forestGreen */
            border-bottom: 2px solid #00BB6E; /* primary */
            padding-bottom: 5px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .card-title {
            font-size: 11px;
            font-weight: 700;
            color: #00BB6E; /* primary */
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            border-bottom: 1px solid #F0FBF6; /* lightGreen */
            padding-bottom: 4px;
          }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          
          h3 { font-size: 12px; color: #002322; margin-bottom: 6px; font-weight: 600; }
          p { margin-bottom: 6px; color: #374151; }
          ul { padding-left: 16px; margin-bottom: 8px; }
          li { margin-bottom: 3px; color: #4b5563; }
          
          .chip {
            display: inline-block;
            background: #F0FBF6; /* lightGreen */
            color: #002322; /* forestGreen */
            border: 1px solid #00BB6E; /* primary */
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            margin-right: 4px;
            margin-bottom: 4px;
          }
          
          .stat-box {
            text-align: center;
            padding: 8px;
            background: #F0FBF6; /* lightGreen */
            border: 1px solid #00BB6E; /* primary */
            border-radius: 6px;
          }
          .stat-label { font-size: 9px; color: #002322; text-transform: uppercase; font-weight: 600; }
          .stat-value { font-size: 14px; font-weight: 700; color: #00BB6E; }

          .timeline-item {
             position: relative;
             padding-left: 15px;
             margin-bottom: 8px;
          }
          .timeline-item:before {
            content: '';
            position: absolute;
            left: 0;
            top: 5px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #00BB6E; /* primary */
          }
          
          .resource-item {
             font-size: 10px;
             margin-bottom: 6px;
             padding-bottom: 6px;
             border-bottom: 1px dashed #e5e7eb;
          }
          .resource-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
             <h1>${finalRoadmap.goal}</h1>
             <p>Your Personalized Path to Mastery</p>
          </div>
          <div style="text-align: right;">
             <p class="header-meta">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <!-- Quick Stats -->
        ${nextSteps?.quickSummary ? `
          <div class="section">
             <div class="grid-3">
                <div class="stat-box">
                   <div class="stat-label">Duration</div>
                   <div class="stat-value">${nextSteps.quickSummary.totalJourneyTime}</div>
                </div>
                <div class="stat-box">
                   <div class="stat-label">Daily Effort</div>
                   <div class="stat-value">${nextSteps.quickSummary.dailyCommitment}</div>
                </div>
                <div class="stat-box">
                   <div class="stat-label">Success Rate</div>
                   <div class="stat-value">${nextSteps.quickSummary.successProbability}</div>
                </div>
             </div>
          </div>
        ` : ''}

        <!-- Executive Summary -->
        ${roadmap.executiveSummary ? `
          <div class="section">
            <div class="section-title">📋 Strategic Overview</div>
            
            <div class="card" style="margin-bottom: 12px;">
               <p><strong>Goal Analysis:</strong> ${roadmap.executiveSummary.goalOverview}</p>
               <p><strong>Timeline Reality:</strong> ${roadmap.executiveSummary.timelineReality}</p>
               ${roadmap.executiveSummary.personalizedAssessment ? `<p><strong>Assessment:</strong> ${roadmap.executiveSummary.personalizedAssessment}</p>` : ''}
            </div>

            <div class="grid-3">
              ${roadmap.executiveSummary.competitiveAdvantages ? `
                  <div class="card">
                     <div class="card-title">Your Advantages</div>
                     <ul>
                       ${roadmap.executiveSummary.competitiveAdvantages.map(c => `<li>${c}</li>`).join('')}
                     </ul>
                  </div>
              ` : ''}
              <div class="card">
                <div class="card-title">Success Factors</div>
                <ul>
                  ${roadmap.executiveSummary.keySuccessFactors?.map(f => `<li>${f}</li>`).join('') || ''}
                </ul>
              </div>
              <div class="card">
                 <div class="card-title">Unique Challenges</div>
                 <ul>
                   ${roadmap.executiveSummary.uniqueChallenges?.map(c => `<li>${c}</li>`).join('') || '<li>None identified</li>'}
                 </ul>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Goal Deep Dive -->
        ${roadmap.goalDetails ? `
           <div class="section">
              <div class="section-title">🎯 Goal Deep Dive</div>
              <div class="card">
                 <p><strong>What it Involves:</strong> ${roadmap.goalDetails.whatItInvolves}</p>
              </div>
              <div class="grid-2">
                 <div class="card">
                    <div class="card-title">Required Skills</div>
                    <div>
                       ${roadmap.goalDetails.skillsRequired?.map(s => {
         const clean = typeof s === 'string' ? s.replace(/\*\*/g, '') : JSON.stringify(s);
         return `<span class="chip">${clean}</span>`;
      }).join('') || ''}
                    </div>
                 </div>
                 <div class="card">
                    <div class="card-title">Knowledge Areas</div>
                     <ul>
                       ${roadmap.goalDetails.knowledgeAreas?.map(k => `<li>${k}</li>`).join('') || ''}
                     </ul>
                 </div>
              </div>
              <div class="grid-2">
                ${roadmap.goalDetails.certifications?.length ? `
                  <div class="card">
                    <div class="card-title">Rec. Certifications</div>
                    ${roadmap.goalDetails.certifications.map(c => `
                      <div class="resource-item">
                        ${typeof c === 'string' ? `• ${c}` : `
                          • <strong>${c.certificationName}</strong>
                          <div style="font-size:9px; color:#666;">${c.provider || ''}</div>
                          <div style="font-size:8px; color:#888; margin-top:2px; margin-bottom:2px;">
                             ${c.cost ? `<span style="background:#f3f4f6; padding:1px 4px; border-radius:3px;">${c.cost}</span>` : ''}
                             ${c.duration ? `<span style="background:#f3f4f6; padding:1px 4px; border-radius:3px; margin-left:4px;">${c.duration}</span>` : ''}
                          </div>
                          ${c.websiteUrl ? `<a href="${c.websiteUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">View Certification &rarr;</a>` : ''}
                        `}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                ${roadmap.goalDetails.careerPathways?.length ? `
                  <div class="card">
                    <div class="card-title">Future Pathways</div>
                    <div>${roadmap.goalDetails.careerPathways.map(p => `<span class="chip">${p}</span>`).join('')}</div>
                  </div>
                ` : ''}
              </div>
           </div>
        ` : ''}

        <!-- Learning Path - SHOW ALL PHASES -->
        ${roadmap.learningPath?.phases ? `
        <div class="section">
          <div class="section-title">🎓 Learning Path</div>
          ${roadmap.learningPath.phases.map((phase, i) => `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
              <h3 style="background:#F0FBF6; padding:8px; border-radius:4px; border-left:4px solid #00BB6E;">Phase ${i + 1}: ${phase.phaseName} <span style="font-weight:400; color:#002322; font-size:11px; margin-left:10px;">(${phase.duration})</span></h3>
              
              <div class="grid-2" style="margin-top:10px;">
                 <div class="card">
                    <div class="card-title">Objectives & Knowledge</div>
                    <ul>
                       ${phase.objectives?.map(o => `<li>${o}</li>`).join('') || ''}
                    </ul>
                    <div style="margin-top:8px;">
                       ${phase.knowledgeToGain?.map(k => `<span class="chip">${k}</span>`).join('') || ''}
                    </div>
                 </div>
                 
                 <div class="card">
                    <div class="card-title">Schedule & Strategy</div>
                     ${phase.dailySchedule?.recommendedHours ? `<p style="font-size:10px;"><strong>Daily:</strong> ${phase.dailySchedule.recommendedHours}</p>` : ''}
                     ${phase.dailySchedule?.weeklyPlan ? `<p style="font-size:10px;"><strong>Weekly:</strong> ${phase.dailySchedule.weeklyPlan}</p>` : ''}
                     
                     <div style="margin-top:8px;">
                        ${phase.practicalProjects?.map((p, idx) => {
         if (typeof p === 'string') {
            let parts = p.split(':');
            return `<div style="font-size:10px; margin-bottom:4px;">
                                • <strong>Project: ${parts[0]}</strong>
                                ${parts[1] ? `<div style="color:#6b7280; padding-left:8px; font-style:italic;">${parts[1]}</div>` : ''}
                              </div>`;
         }
         // Object format
         return `
                           <div style="font-size:10px; margin-bottom:8px; background:#fafafa; border:1px solid #eee; padding:6px; border-radius:4px;">
                              <div style="font-weight:700; color:#00BB6E; margin-bottom:2px;">${p.projectName || p.title || `Project ${idx + 1}`}</div>
                              <div style="margin-bottom:4px; display:flex; gap:8px; color:#555; font-size:9px;">
                                 ${p.difficulty ? `<span>Difficulty: ${p.difficulty}</span>` : ''}
                                 ${p.timeRequired ? `<span>Time: ${p.timeRequired}</span>` : ''}
                              </div>
                              ${p.expectedOutcome ? `<div style="color:#4b5563; font-style:italic; margin-bottom:4px;">Outcome: ${p.expectedOutcome}</div>` : ''}
                              ${p.skillsUsed ? `<div style="color:#6b7280; font-size:9px;">Skills: ${Array.isArray(p.skillsUsed) ? p.skillsUsed.join(', ') : p.skillsUsed}</div>` : ''}
                           </div>
                           `;
      }).join('') || ''}
                     </div>
                 </div>
              </div>
              
              <div class="grid-2">
                 <div class="card">
                    <div class="card-title">Core Activities</div>
                    ${phase.keyActivities?.map(a => `<div class="timeline-item">${a}</div>`).join('') || ''}
                 </div>
                 <div class="card">
                    <div class="card-title">Milestones</div>
                    ${phase.milestones?.map(m => `
                       <div style="margin-bottom:6px; font-size:10px; border-bottom:1px dashed #eee; padding-bottom:4px;">
                          <strong>${m.milestone}</strong> <span style="color:#6b7280;">(By ${m.targetDate})</span>
                       </div>
                    `).join('') || ''}
                 </div>
              </div>
            </div>
          `).join('') || ''}
        </div>
        ` : ''}

        <!-- Strategy & Challenges -->
        <div class="section">
           <div class="section-title">🛡️ Strategy & Support</div>
           <div class="grid-2">
              ${roadmap.practiceStrategy ? `
                 <div class="card">
                    <div class="card-title">Practice Strategy</div>
                    ${roadmap.practiceStrategy.skillBuilding?.dailyPractice ? `<p><strong>Daily:</strong> ${roadmap.practiceStrategy.skillBuilding.dailyPractice}</p>` : ''}
                    ${roadmap.practiceStrategy.assessmentMethods ? `
                       <div style="margin-top:5px;"><strong>Assessments:</strong> ${roadmap.practiceStrategy.assessmentMethods.map(m => m.methodName).join(', ')}</div>
                    ` : ''}
                 </div>
              ` : ''}
              
              ${roadmap.overcomingChallenges ? `
                 <div class="card">
                    <div class="card-title">Challenges</div>
                    ${roadmap.overcomingChallenges.commonObstacles?.map(o => `
                       <div style="margin-bottom:4px; font-size:10px;">• <strong>${o.obstacle}</strong>: ${o.resolutionStrategy}</div>
                    `).join('') || ''}
                 </div>
              ` : ''}
           </div>
           
           <div class="grid-2">
              ${roadmap.mentorshipAndNetworking ? `
                 <div class="card">
                    <div class="card-title">Networking</div>
                    <p style="font-size:10px;">${roadmap.mentorshipAndNetworking.findingMentors?.approachStrategy || ''}</p>
                    <div style="margin-top:5px;">
                       ${roadmap.mentorshipAndNetworking.peerCommunities?.map(c => `<span class="chip">${c.communityName}</span>`).join('') || ''}
                    </div>
                 </div>
              ` : ''}
              
              ${roadmap.budgetOptimization ? `
                 <div class="card">
                    <div class="card-title">Budget Smart</div>
                    ${roadmap.budgetOptimization.freeResources?.length ? `
                      <div style="margin-bottom:6px;">
                        <strong>Free Resources:</strong>
                        <ul>${roadmap.budgetOptimization.freeResources.map(r => `<li>${r}</li>`).join('')}</ul>
                      </div>
                    ` : ''}
                    ${roadmap.budgetOptimization.costSavingTips?.length ? `
                      <div style="margin-top:6px; border-top:1px dashed #eee; padding-top:6px;">
                        <strong>Smart Saving Tips:</strong>
                        <ul>${roadmap.budgetOptimization.costSavingTips.map(t => `<li>${t}</li>`).join('')}</ul>
                      </div>
                    ` : ''}
                 </div>
              ` : ''}
           </div>
        </div>

        <!-- Resources - SHOW ALL RESOURCES -->
        ${roadmap.resourceLibrary ? `
           <div class="section">
              <div class="section-title">📚 Resource Library</div>
              <div class="grid-3">
                 ${roadmap.resourceLibrary.essentialBooks?.length ? `
                    <div class="card">
                       <div class="card-title">Books</div>
                       ${roadmap.resourceLibrary.essentialBooks.map(b => `
                         <div class="resource-item">
                           • <strong>${b.title}</strong> by ${b.author}
                           <div style="margin-top:2px; margin-bottom:2px;">
                             ${b.difficulty ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${b.difficulty}</span>` : ''}
                           </div>
                           ${b.purchaseLink ? `<a href="${b.purchaseLink}" target="_blank" style="color:#00BB6E; text-decoration:none;">View Book &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                 ${roadmap.resourceLibrary.onlinePlatforms?.length ? `
                    <div class="card">
                       <div class="card-title">Platforms</div>
                       ${roadmap.resourceLibrary.onlinePlatforms.map(p => `
                         <div class="resource-item">
                           • ${p.platformName}
                           <div style="margin-top:2px; margin-bottom:2px;">
                              ${p.priceRange ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${p.priceRange}</span>` : ''}
                           </div>
                           ${p.platformUrl ? `<a href="${p.platformUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">Visit Platform &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                 ${roadmap.resourceLibrary.youtubeChannels?.length ? `
                    <div class="card">
                       <div class="card-title">YouTube</div>
                       ${roadmap.resourceLibrary.youtubeChannels.map(y => `
                         <div class="resource-item">
                           • ${y.channelName}
                           <div style="margin-top:2px; margin-bottom:2px;">
                              ${y.subscribers ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${y.subscribers} Subs</span>` : ''}
                           </div>
                           ${y.channelUrl ? `<a href="${y.channelUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">Watch Channel &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                 ${roadmap.resourceLibrary.mobileApps?.length ? `
                    <div class="card">
                       <div class="card-title">Mobile Apps</div>
                       ${roadmap.resourceLibrary.mobileApps.map(a => `
                         <div class="resource-item">
                           • ${a.appName}
                           <div style="margin-top:2px; margin-bottom:2px;">
                              ${a.rating ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">★ ${a.rating}</span>` : ''}
                           </div>
                           ${a.downloadUrl ? `<a href="${a.downloadUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">Get App &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                 ${roadmap.resourceLibrary.podcastsAndAudiobooks?.length ? `
                    <div class="card">
                       <div class="card-title">Podcasts</div>
                       ${roadmap.resourceLibrary.podcastsAndAudiobooks.map(p => `
                         <div class="resource-item">
                           • ${p.name}
                           <div style="margin-top:2px; margin-bottom:2px;">
                              ${p.averageLength ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${p.averageLength}</span>` : ''}
                           </div>
                           ${p.url ? `<a href="${p.url}" target="_blank" style="color:#00BB6E; text-decoration:none;">Listen Now &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                  ${roadmap.resourceLibrary.blogs?.length ? `
                    <div class="card">
                       <div class="card-title">Blogs</div>
                       ${roadmap.resourceLibrary.blogs.map(b => `
                         <div class="resource-item">
                           • ${b.blogName}
                           ${b.blogUrl ? `<br><a href="${b.blogUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">Read Blog &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
                  ${roadmap.resourceLibrary.certificationPrograms?.length ? `
                    <div class="card">
                       <div class="card-title">Certifications</div>
                       ${roadmap.resourceLibrary.certificationPrograms.map(c => `
                         <div class="resource-item">
                           • ${c.certificationName}
                           <div style="margin-top:2px; margin-bottom:2px;">
                              ${c.cost ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${c.cost}</span>` : ''}
                              ${c.duration ? `<span style="background:#eee; color:#555; padding:1px 4px; border-radius:3px; font-size:8px;">${c.duration}</span>` : ''}
                           </div>
                           ${c.websiteUrl ? `<a href="${c.websiteUrl}" target="_blank" style="color:#00BB6E; text-decoration:none;">View Details &rarr;</a>` : ''}
                         </div>
                       `).join('')}
                    </div>
                 ` : ''}
              </div>
           </div>
        ` : ''}

        <!-- Success Metrics & Next Steps -->
        <div class="section">
           <div class="section-title">🚀 Execution Plan</div>
           
           <div class="grid-2">
             <div class="card">
                <div class="card-title">Immediate Actions</div>
                ${nextSteps?.immediateActions?.map((a, i) => `
                   <div style="margin-bottom:6px; font-size:10px;">
                      <strong>${i + 1}. ${a.action}</strong>
                      <div style="color:#6b7280;">Outcome: ${a.expectedOutcome}</div>
                   </div>
                `).join('') || ''}
             </div>
             
             <div class="card">
                <div class="card-title">Success Metrics & Milestones</div>
                ${roadmap.successMetrics?.quantitativeMetrics?.map(m => `
                   <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px; border-bottom:1px solid #eee;">
                      <span>${m.metric}</span>
                      <strong>${m.improvementRate || m.frequency}</strong>
                   </div>
                `).join('') || ''}
                
                <div style="margin-top:10px;">
                   ${roadmap.successMetrics?.celebrationPoints?.map(p => `<span class="chip">🎉 ${p.achievement}</span>`).join('') || ''}
                </div>
             </div>
           </div>
        </div>
        
        <div class="header" style="border-top:1px solid #eee; border-bottom:none; margin-top:30px; padding-top:20px;">
           <p style="margin:0 auto; color:#6b7280; font-size:10px; font-weight:400;">Excel with Queekies • Your Journey Begins Now</p>
        </div>

      </body>
      </html>
    `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
         setTimeout(() => {
            printWindow.print();
            // Optional: Close window after print
            // printWindow.close();
         }, 500);
      };
   };

   if (!finalRoadmap) return null;

   return (
      <button
         onClick={generatePDF}
         className="bg-primary text-white font-semibold py-2 px-5 rounded-md shadow-sm transition-opacity hover:opacity-90 flex items-center gap-2 text-sm"
      >
         <Download className="w-4 h-4" />
         <span>Download PDF</span>
      </button>
   );
};

export default RoadmapPDFGenerator
