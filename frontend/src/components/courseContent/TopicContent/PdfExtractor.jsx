/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useSummarizePassageMutation } from '../../../services/Ai/summarizeApi';
import { useCreateSummaryMutation, useGetSummariesByGeneralMaterialPdfIdQuery } from '../../../services/Ai/summaryApi';
import { useCreateBulletPointMutation } from '../../../services/Ai/bulletPointApi';
import { useCreateFlashCardMutation } from '../../../services/Ai/flashCardApi';
import toast from 'react-hot-toast';

// Set the worker path to the local script
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'; // Ensure this matches the version

const PdfExtractor = ({ pdfPath, access_token, onSummaryGenerated, materialUrl, topicId, general_flag, ms_gen_flag }) => {
  let passage = ''; // Variable to store the extracted text
  const [hasSummary, setHasSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summarizePassage, { data, error, isLoading }] = useSummarizePassageMutation();
  const [createSummary] = useCreateSummaryMutation();
  const [createBulletPoint] = useCreateBulletPointMutation();
  const [createFlashCard] = useCreateFlashCardMutation();

  const { data: existingSummaries, isLoading: isLoadingSummaries } = useGetSummariesByGeneralMaterialPdfIdQuery({
    topic_id: topicId,
    general_material_pdf_id: 1,
    access_token,
  });

  useEffect(() => {
    if (existingSummaries && existingSummaries.length > 0) {
      setHasSummary(true);
      const summary = existingSummaries[0];
      setSummaryData({
        summary: summary.summary,
        bullet_points: summary.bullet_points.map(bp => bp.bullet_point),
        flash_cards: summary.flash_cards.map(fc => ({
          question: fc.question,
          answer: fc.answer,
        })),
      });
    } else {
      setHasSummary(false);
      setSummaryData(null);
    }
  }, [existingSummaries]);

  const viewSummary = () => {
    if (summaryData && onSummaryGenerated) {
      onSummaryGenerated(summaryData);
    }
  };

  const MAX_PASSAGE_LENGTH = 80000; // Adjust based on server limits

  const extractAndSummarize = async () => {
    if (!materialUrl) return;

    try {
      const pdfUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${materialUrl}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      passage = fullText.slice(0, MAX_PASSAGE_LENGTH); // Truncate to 50,000 characters

      const result = await summarizePassage({ passage, access_token }).unwrap();

      const summaryData = {
        topic_id: topicId,
        summary: result.summary,
        general_material_desc_id: null,
        general_material_pdf_id: general_flag ? 1 : null,
        accordion_id: null,
        multi_slide_general_desc_id: null,
        multi_slide_general_pdf_id: ms_gen_flag ? 1 : null,
        multi_slide_accordion_id: null,
      };

      const response = await createSummary({ summaryData, access_token }).unwrap();

      const bulletPointData = {
        summary_id: response.id,
        bullet_point: result.bullet_points,
      };

      await createBulletPoint({ bulletPointData, access_token }).unwrap();

      const flashCardData = {
        summary_id: response.id,
        flash_cards: result.flash_cards,
      };

      await createFlashCard({ flashCardData, access_token }).unwrap();

      setSummaryData({
        summary: result.summary,
        bullet_points: result.bullet_points,
        flash_cards: result.flash_cards,
      });
      setHasSummary(true);

      if (onSummaryGenerated) {
        onSummaryGenerated(result);
      }
    } catch (error) {
      console.error('Error loading or parsing PDF:', error);
      toast.error(error.data?.message || error?.data?.error || "Summarize failed. Please try again.")
    }
  };

  return (
    <div>
      {!hasSummary ? (
        <button
          onClick={extractAndSummarize}
          disabled={isLoading || isLoadingSummaries}
          className={`px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105 flex items-center shadow-sm hover:shadow-md ${(isLoading || isLoadingSummaries)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
          {(isLoading || isLoadingSummaries) ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Get PDF Summary
            </>
          )}
        </button>
      ) : (
        <button
          onClick={viewSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View PDF Summary
        </button>
      )}
      {error && <p className="text-red-500 mt-2">Error: {error.data?.error || 'Failed to summarize passage'}</p>}
    </div>
  );
};

export default PdfExtractor;