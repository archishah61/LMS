const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MathSolverLog = require('../../models/aiMathSolver/math_solver');
const { callProcedure } = require('../../utils/procedure/callProcedure');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to convert image to base64
const imageToBase64 = (imagePath) => {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        throw new Error('Error reading image file: ' + error.message);
    }
};

// Helper function to get image MIME type
const getImageMimeType = (imagePath) => {
    const extension = imagePath.toLowerCase().split('.').pop();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
    };
    return mimeTypes[extension] || 'image/jpeg';
};

// Enhanced function to analyze image with comprehensive step-by-step solutions
const analyzeImageWithGemini = async (imagePath, dictOfVars = {}, language = 'english', custom_prompt = "") => {
    try {
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite" });

        // Convert image to base64
        const imageBase64 = imageToBase64(imagePath);
        const mimeType = getImageMimeType(imagePath);

        // Language-specific instructions
        const languageInstructions = {
            'english': 'Provide all explanations, steps, and responses in English.',
            'hindi': 'सभी व्याख्याएं, चरण और उत्तर हिंदी में प्रदान करें। गणितीय सूत्र अंग्रेजी में लिख सकते हैं लेकिन व्याख्या हिंदी में दें।',
            'gujarati': 'બધી સમજૂતીઓ, પગલાંઓ અને જવાબો ગુજરાતીમાં આપો। ગણિતના સૂત્રો અંગ્રેજીમાં લખી શકો છો પણ સમજૂતી ગુજરાતીમાં આપો।',
            'marathi': 'सर्व स्पष्टीकरण, पायऱ्या आणि उत्तरे मराठीमध्ये द्या. गणिताची सूत्रे इंग्रजीमध्ये लिहू शकता परंतु स्पष्टीकरण मराठीमध्ये द्या.',
            'bengali': 'সমস্ত ব্যাখ্যা, ধাপ এবং উত্তর বাংলায় প্রদান করুন। গাণিতিক সূত্র ইংরেজিতে লিখতে পারেন কিন্তু ব্যাখ্যা বাংলায় দিন।',
            'tamil': 'அனைத்து விளக்கங்கள், படிகள் மற்றும் பதில்களை தமிழில் வழங்கவும். கணித சூத்திரங்களை ஆங்கிலத்தில் எழுதலாம் ஆனால் விளக்கம் தமிழில் கொடுங்கள்.',
            'telugu': 'అన్ని వివరణలు, దశలు మరియు సమాధానాలను తెలుగులో అందించండి. గణిత సూత్రాలను ఆంగ్లంలో వ్రాయవచ్చు కానీ వివరణ తెలుగులో ఇవ్వండి.',
            'kannada': 'ಎಲ್ಲಾ ವಿವರಣೆಗಳು, ಹಂತಗಳು ಮತ್ತು ಉತ್ತರಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ಒದಗಿಸಿ. ಗಣಿತದ ಸೂತ್ರಗಳನ್ನು ಇಂಗ್ಲಿಷ್ನಲ್ಲಿ ಬರೆಯಬಹುದು ಆದರೆ ವಿವರಣೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೊಡಿ।',
            'punjabi': 'ਸਾਰੀਆਂ ਵਿਆਖਿਆਵਾਂ, ਕਦਮਾਂ ਅਤੇ ਜਵਾਬਾਂ ਪੰਜਾਬੀ ਵਿੱਚ ਦਿਓ। ਗਣਿਤਕ ਸੁਤਰਾਂ ਨੂੰ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਲਿਖ ਸਕਦੇ ਹੋ ਪਰ ਵਿਆਖਿਆ ਪੰਜਾਬੀ ਵਿੱਚ ਦਿਓ।',
            'urdu': 'تمام وضاحتیں، مراحل اور جوابات اردو میں فراہم کریں۔ ریاضی کے فارمولے انگریزی میں لکھ سکتے ہیں لیکن وضاحت اردو میں دیں।',
            'odia': 'ସମସ୍ତ ବ୍ୟାଖ୍ୟା, ପଦକ୍ଷେପ ଏବଂ ଉତ୍ତରଗୁଡ଼ିକୁ ଓଡ଼ିଆରେ ଦିଅନ୍ତୁ। ଗଣିତ ସୂତ୍ରଗୁଡିକୁ ଇଂରାଜୀରେ ଲେଖିପାରିବେ, କିନ୍ତୁ ବ୍ୟାଖ୍ୟା ଓଡ଼ିଆରେ ଦିଅନ୍ତୁ।',
            'malayalam': 'എല്ലാ വിശദീകരണങ്ങളും ഘട്ടങ്ങളും ഉത്തരങ്ങളും മലയാളത്തില്‍ നല്‍കുക. ഗണിത സൂത്രങ്ങള്‍ ഇംഗ്ലീഷില്‍ എഴുതാം പക്ഷേ വിശദീകരണം മലയാളത്തിലായിരിക്കണം।',
            'assamese': 'সকলো বাখ্যা, পদক্ষেপ আৰু উত্তৰসমূহ অসমীয়াত প্ৰদান কৰক। গণিতৰ সূত্ৰসমূহ ইংৰাজীত লিখিব পাৰিব কিন্তু বাখ্যা অসমীয়াত দিয়ক।'
        };

        // Get language instruction or default to English
        const langInstruction = languageInstructions[language.toLowerCase()] || languageInstructions['english'];

        // Prepare the enhanced prompt for comprehensive analysis
        const dictOfVarsStr = JSON.stringify(dictOfVars);
        const prompt = `You are an expert mathematics tutor. Analyze the mathematical content in this image and provide a comprehensive, step-by-step solution that is educational and easy to understand.

        ${custom_prompt ? `USER CUSTOM INSTRUCTION: ${custom_prompt}` : ""}

IMPORTANT LANGUAGE INSTRUCTION: ${langInstruction}

ANALYSIS REQUIREMENTS:
1. First, identify what type of mathematical problem this is
2. Explain the problem clearly in your own words
3. Provide a detailed, step-by-step solution with explanations for each step
4. Show all intermediate calculations
5. Explain the mathematical concepts, rules, or formulas being used
6. Highlight important insights or common mistakes to avoid
7. Provide the final answer with proper units if applicable

MATHEMATICAL RULES TO FOLLOW:
- Use PEMDAS/BODMAS for order of operations: Parentheses/Brackets, Exponents/Orders, Multiplication and Division (left to right), Addition and Subtraction (left to right)
- Show algebraic manipulations clearly
- Use direct Unicode math symbols instead of LaTeX or code style. For example, write x² instead of x^2, √9 instead of sqrt(9), and ½ instead of 1/2. Do not wrap expressions in $...$
- For geometry problems, explain the theorems or properties used
- For word problems, identify given information and what needs to be found
- For calculus problems, explain the derivative/integral rules applied

PROBLEM CATEGORIES YOU MIGHT ENCOUNTER:
1. Arithmetic Operations: Simple calculations with detailed steps
2. Algebraic Equations: Show isolation of variables step by step
3. Geometric Problems: Explain theorems, show diagram analysis
4. Trigonometry: Show angle relationships and identities used
5. Calculus: Explain differentiation/integration rules and applications
6. Word Problems: Break down the problem, identify variables, set up equations
7. Statistics/Probability: Explain formulas and reasoning
8. Graph Analysis: Interpret data, find patterns, make calculations

RESPONSE FORMAT:
Return a JSON object with the following structure (maintain field names in English but content should be in ${language}):
{
    "problemType": "Description of the type of math problem",
    "problemStatement": "Clear restatement of what the problem is asking",
    "givenInformation": ["List", "of", "given", "facts", "or", "values"],
    "approach": "Brief explanation of the solution strategy",
    "stepByStepSolution": [
        {
            "stepNumber": 1,
            "title": "Brief title of this step",
            "explanation": "Detailed explanation of what we're doing and why",
            "calculation": "The actual mathematical work being done",
            "result": "The result of this step"
        }
    ],
    "finalAnswer": "The complete final answer with units if applicable",
    "keyLearning": "Important mathematical concepts or insights from this problem",
    "commonMistakes": "Common errors students might make with this type of problem"
}

ADDITIONAL INSTRUCTIONS:
- If there are variables in the dictionary provided: ${dictOfVarsStr}, substitute their values
- Use proper mathematical notation
- Be encouraging and educational in your explanations
- If the image contains multiple distinct problems, you must return a JSON object with keys like "Problem 1", "Problem 2", etc., where each value follows the single problem structure defined above.
- For abstract concepts or non-mathematical drawings, adapt the format to explain the concept thoroughly

Analyze the image now and provide your comprehensive response:`;

        // Prepare image data for Gemini
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType
            }
        };

        // Generate content
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        let parsedResponse = {};
        try {
            // Try to parse the response as JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;

            parsedResponse = JSON.parse(jsonStr);

        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            // Fallback: create a structured response from the text
            const fallbackMessages = {
                'hindi': {
                    problemType: "छवि से गणितीय समस्या",
                    problemStatement: "अपलोड की गई छवि से समस्या निकाली गई",
                    approach: "गणितीय सामग्री का AI विश्लेषण",
                    title: "विश्लेषण परिणाम",
                    explanation: "AI ने छवि का विश्लेषण किया है और निम्नलिखित प्रतिक्रिया प्रदान की है:",
                    result: "कृपया ऊपर दिया गया विस्तृत विश्लेषण देखें",
                    finalAnswer: "कृपया ऊपर दिए गए विस्तृत विश्लेषण की समीक्षा करें",
                    keyLearning: "गणितीय समस्या समाधान के लिए सावधानीपूर्वक चरणबद्ध विश्लेषण की आवश्यकता होती है",
                    commonMistakes: "हमेशा गणनाओं की दोबारा जांच करें और संचालन के उचित क्रम का पालन करें"
                },
                'gujarati': {
                    problemType: "છબીમાંથી ગણિતની સમસ્યા",
                    problemStatement: "અપલોડ કરેલી છબીમાંથી સમસ્યા લીધી",
                    approach: "ગણિતીય સામગ્રીનું AI વિશ્લેષણ",
                    title: "વિશ્લેષણ પરિણામ",
                    explanation: "AI એ છબીનું વિશ્લેષણ કર્યું છે અને નીચેનો પ્રતિસાદ આપ્યો છે:",
                    result: "કૃપા કરીને ઉપરનું વિગતવાર વિશ્લેષણ જુઓ",
                    finalAnswer: "કૃપા કરીને ઉપરના વિગતવાર વિશ્લેષણની સમીક્ષા કરો",
                    keyLearning: "ગણિતની સમસ્યા હલ કરવા માટે સાવચેતીપૂર્વક પગલાં લેવાનું વિશ્લેષણ જરૂરી છે",
                    commonMistakes: "હંમેશા ગણતરીઓની બે વાર તપાસ કરો અને યોગ્ય ક્રમનું પાલન કરો"
                }
            };

            const messages = fallbackMessages[language.toLowerCase()] || {
                problemType: "Mathematical Problem from Image",
                problemStatement: "Problem extracted from uploaded image",
                approach: "AI analysis of mathematical content",
                title: "Analysis Result",
                explanation: "The AI has analyzed the image and provided the following response:",
                result: "See detailed explanation above",
                finalAnswer: "Please review the detailed analysis above",
                keyLearning: "Mathematical problem solving requires careful step-by-step analysis",
                commonMistakes: "Always double-check calculations and follow proper order of operations"
            };

            parsedResponse = {
                problemType: messages.problemType,
                problemStatement: messages.problemStatement,
                givenInformation: [messages.problemStatement],
                approach: messages.approach,
                stepByStepSolution: [
                    {
                        stepNumber: 1,
                        title: messages.title,
                        explanation: messages.explanation,
                        calculation: text,
                        result: messages.result
                    }
                ],
                finalAnswer: messages.finalAnswer,
                keyLearning: messages.keyLearning,
                commonMistakes: messages.commonMistakes
            };
        }

        return parsedResponse;

    } catch (error) {
        console.error('Error analyzing image with Gemini:', error);
        throw new Error('Failed to analyze image: ' + error.message);
    }
};

// Enhanced text-based math problem solver
const solveMathProblem = (input, dictOfVars = {}, language = 'english') => {
    try {
        // Language-specific messages
        const messages = {
            'hindi': {
                problemType: "टेक्स्ट-आधारित गणितीय समस्या",
                approach: "चरणबद्ध बीजगणितीय/अंकगणितीय समाधान",
                title: "समस्या विश्लेषण",
                explanation: "दिए गए गणितीय व्यंजक का विश्लेषण",
                result: "हल करने के लिए तैयार",
                finalAnswer: "समाधान यहां गणना किया जाएगा",
                keyLearning: "गणितीय समस्या समाधान के सिद्धांत लागू किए गए",
                commonMistakes: "संचालन के क्रम का पालन करना याद रखें"
            },
            'gujarati': {
                problemType: "ટેક્સ્ટ-આધારિત ગણિતની સમસ્યા",
                approach: "પગલાંવાર બીજગણિત/અંકગણિત ઉકેલ",
                title: "સમસ્યા વિશ્લેષણ",
                explanation: "આપેલ ગણિતીય અભિવ્યક્તિનું વિશ્લેષણ",
                result: "હલ કરવા માટે તૈયાર",
                finalAnswer: "ઉકેલ અહીં ગણવામાં આવશે",
                keyLearning: "ગણિતની સમસ્યા હલ કરવાના સિદ્ધાંતો લાગુ કર્યા",
                commonMistakes: "ક્રિયાઓના ક્રમને યાદ રાખો"
            }
        };

        const msg = messages[language.toLowerCase()] || {
            problemType: "Text-based Mathematical Problem",
            approach: "Step-by-step algebraic/arithmetic solution",
            title: "Problem Analysis",
            explanation: "Analyzing the given mathematical expression",
            result: "Ready to solve",
            finalAnswer: "Solution would be calculated here",
            keyLearning: "Mathematical problem solving principles applied",
            commonMistakes: "Remember to follow order of operations"
        };

        const response = {
            problemType: msg.problemType,
            problemStatement: input,
            givenInformation: Object.keys(dictOfVars).length > 0 ?
                [`Variables provided: ${JSON.stringify(dictOfVars)}`] :
                [msg.explanation],
            approach: msg.approach,
            stepByStepSolution: [
                {
                    stepNumber: 1,
                    title: msg.title,
                    explanation: msg.explanation,
                    calculation: input,
                    result: msg.result
                }
            ],
            finalAnswer: msg.finalAnswer,
            keyLearning: msg.keyLearning,
            commonMistakes: msg.commonMistakes
        };

        // Here you would integrate your existing math solving logic
        // and format it according to the step-by-step structure

        return response;
    } catch (error) {
        throw new Error('Error solving math problem: ' + error.message);
    }
};

const mathSolver = async (req, res, next) => {
    try {
        const { equation, problem, dict_of_vars, language, custom_prompt } = req.body;
        let input = equation || problem;
        let dictOfVars = {};
        let selectedLanguage = language || 'english'; // Default to English

        const user_id = req.user?.id;

        const { success, data, error } = await callProcedure("getUserDailyFeatureCount", [user_id, "math_solver"]);
        if (!success) return next(error);
        const { success: sLimit, data: dLimit, error: eLimit } = await callProcedure("getFeatureSettings", ["math_solver"]);
        if (!sLimit) return next(eLimit);

        const featureDetails = data[0];

        if (dLimit[0]?.limit && featureDetails?.count >= dLimit[0]?.limit) {
            return res.status(409).json({
                error: 'Your Usage Limit is Reached.',
                success: false
            });
        }

        // Parse dict_of_vars if provided
        if (dict_of_vars) {
            try {
                dictOfVars = typeof dict_of_vars === 'string' ? JSON.parse(dict_of_vars) : dict_of_vars;
            } catch (parseError) {
                dictOfVars = {};
            }
        }

        // Check if image was uploaded
        if (req.file && req.file.fieldname === 'mathImage') {

            try {
                // Use enhanced Gemini API to analyze the image with language support
                const comprehensiveAnalysis = await analyzeImageWithGemini(req.file.path, dictOfVars, selectedLanguage, custom_prompt);

                // Clean up uploaded file after processing
                // fs.unlinkSync(req.file.path);

                const { success, data, error } = await callProcedure("createMathSolverLog", [
                    req.user?.id || null,
                    'image',
                    req.file ? req.file.path : null,
                    JSON.stringify(dictOfVars) || null,
                    selectedLanguage || null,
                    custom_prompt || null,
                    JSON.stringify(comprehensiveAnalysis) || null
                ]);

                if (!success) return next(error);

                return res.json({
                    message: 'Image processed successfully with comprehensive analysis',
                    data: comprehensiveAnalysis,
                    extractedFromImage: true,
                    success: true,
                    status: 'success',
                    analysisType: 'comprehensive_step_by_step',
                    language: selectedLanguage
                });

            } catch (imageError) {
                // Clean up uploaded file in case of error
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    error: 'Error processing image with AI: ' + imageError.message,
                    success: false
                });
            }
        }

        // Handle text-based math problems with enhanced step-by-step solution
        if (!input) {
            return res.status(400).json({
                error: 'Math problem, equation, or image is required',
                success: false
            });
        }

        // Use enhanced text-based problem solver with language support
        const comprehensiveSolution = solveMathProblem(input, dictOfVars, selectedLanguage);

        const result = await callProcedure("createMathSolverLog", [
            req.user?.id || null,
            req.file ? 'image' : 'text',
            req.file ? req.file.path : null,
            dictOfVars || null,
            selectedLanguage || null,
            custom_prompt || null,
            comprehensiveSolution || null
        ]);

        if (!result?.success) return next(result?.error);

        return res.json({
            message: 'Text problem solved with step-by-step analysis',
            data: comprehensiveSolution,
            extractedFromImage: false,
            success: true,
            analysisType: 'comprehensive_step_by_step',
            language: selectedLanguage
        });

    } catch (error) {
        // Clean up uploaded file in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        next(error);
    }
};

const getUserMathHistory = async (req, res, next) => {
    try {
        const user_id = req.user.id; // Assuming you have user authentication middleware

        const { success, data, error } = await callProcedure("getUserMathSolverHistory", [user_id]);

        if (!success) return next(error);

        // Format the response for frontend
        const formattedHistory = data.map(item => ({
            id: item.id,
            equation: item.solution?.data?.expr || item.solution?.data?.problemStatement || 'Math Problem',
            solution: { data: item.solution },
            timestamp: new Date(item.created_at).toLocaleString(),
            inputMode: item.input_type,
            prompt: item.custom_prompt,
            language: item.language,
            dict_of_vars: item.dict_of_vars,
            image_url: item.image_url,
            created_at: item.created_at
        }));

        return res.status(200).json({
            success: true,
            data: formattedHistory
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { mathSolver, getUserMathHistory };

// const fs = require("fs");
// const sharp = require('sharp');
// const Tesseract = require('tesseract.js');
// const path = require('path');
// const { create, all } = require('mathjs');

// const mathjs = create(all);

// // Configure mathjs for precise calculations
// mathjs.config({
//     number: 'Fraction',
//     precision: 14
// });

// // Main solver function
// function identifyAndSolveMathProblem(input) {
//     try {
//         const cleanInput = input.trim().replace(/(\*{2,}|\^{2,})/g, '^');
//         if (!cleanInput) {
//             throw new Error('No input provided');
//         }

//         const problemType = identifyProblemType(cleanInput);

//         const solver = getSolverFunction(problemType);
//         const solution = solver(cleanInput);

//         if (!solution || !solution.steps || solution.steps.length === 0) {
//             throw new Error('Failed to generate solution steps');
//         }

//         return solution;
//     } catch (error) {
//         throw new Error(`Math solving error: ${error.message}`);
//     }
// }

// // Problem type identification - 10 basic types
// function identifyProblemType(input) {
//     const lowerInput = input.toLowerCase();

//     // Check for specific problem types in order of complexity
//     if (isQuadraticEquation(input)) return 'QUADRATIC_EQUATIONS';
//     if (isLinearEquation(input)) return 'LINEAR_EQUATIONS';
//     if (isFractionProblem(input, lowerInput)) return 'FRACTIONS';
//     if (isPercentageProblem(input, lowerInput)) return 'PERCENTAGES';
//     if (isExponentProblem(input, lowerInput)) return 'EXPONENTS';
//     if (isFactorialProblem(input, lowerInput)) return 'FACTORIAL';
//     if (isBasicArithmetic(input)) return 'BASIC_ARITHMETIC';

//     return 'BASIC_ARITHMETIC'; // Default fallback
// }

// // Helper identification functions
// function isQuadraticEquation(input) {
//     return /x\^2|x²|x\*\*2/.test(input) && /=/.test(input);
// }

// function isLinearEquation(input) {
//     return /=/.test(input) && /[a-zA-Z]/.test(input) && !isQuadraticEquation(input);
// }

// function isFractionProblem(input, lowerInput) {
//     return /\d+\/\d+/.test(input) || /\bfraction\b/.test(lowerInput);
// }

// function isPercentageProblem(input, lowerInput) {
//     return /%/.test(input) || /\bpercent\b/.test(lowerInput);
// }

// function isWordProblem(lowerInput) {
//     return /\b(sum|total|difference|product|more than|less than|times|divided by)\b/.test(lowerInput);
// }

// function isExponentProblem(input, lowerInput) {
//     return /\^|\*\*|\bpower\b/.test(input) || /\bexponent\b/.test(lowerInput);
// }

// function isRadicalProblem(input, lowerInput) {
//     return /√|sqrt|\bsquare root\b/.test(input) || /\bradical\b/.test(lowerInput);
// }

// function isStatisticsProblem(lowerInput) {
//     return /\b(mean|median|mode|average)\b/.test(lowerInput);
// }

// function isFactorialProblem(input, lowerInput) {
//     return /!/.test(input) || /\bfactorial\b/.test(lowerInput);
// }

// function isBasicArithmetic(input) {
//     return /^[\d\s\+\-\*\/\(\)\.]+$/.test(input) && !/[a-zA-Z]/.test(input);
// }

// // Get the appropriate solver function
// function getSolverFunction(problemType) {
//     const solvers = {
//         'BASIC_ARITHMETIC': solveBasicArithmetic, // done
//         'LINEAR_EQUATIONS': solveLinearEquations, // done
//         'QUADRATIC_EQUATIONS': solveQuadraticEquations, // done not for (x + 3)(x - 2) = 0
//         'FRACTIONS': solveFractions, // done
//         'PERCENTAGES': solvePercentages, // done
//         'EXPONENTS': solveExponents,
//         'FACTORIAL': solveFactorial
//     };

//     return solvers[problemType] || solveBasicArithmetic;
// }

// // 1. Basic Arithmetic Solver
// function solveBasicArithmetic(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Evaluating the arithmetic expression"
//     });

//     try {
//         const result = mathjs.evaluate(input);
//         steps.push({
//             equation: `= ${result}`,
//             explanation: "Final result"
//         });

//         return {
//             problemType: 'Basic Arithmetic',
//             originalProblem: input,
//             steps,
//             finalAnswer: result.toString()
//         };
//     } catch (error) {
//         throw new Error('Invalid arithmetic expression');
//     }
// }

// // 2. Linear Equations Solver
// function solveLinearEquations(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Original linear equation"
//     });

//     try {
//         const [lhs, rhs] = input.split('=').map(s => s.trim());

//         // Move all terms to one side
//         const equation = `${lhs} - (${rhs})`;
//         const simplified = mathjs.simplify(equation);

//         steps.push({
//             equation: `${simplified.toString()} = 0`,
//             explanation: "Moved all terms to one side and simplified"
//         });

//         // Find the variable
//         let variable = null;
//         simplified.traverse(node => {
//             if (node.isSymbolNode && !variable) variable = node.name;
//         });

//         if (!variable) throw new Error("No variable found");

//         // Solve: ax + b = 0 => x = -b/a
//         const a = mathjs.derivative(simplified, variable).evaluate();
//         const b = simplified.evaluate({ [variable]: 0 });
//         const solution = -b / a;

//         steps.push({
//             equation: `${variable} = ${solution}`,
//             explanation: `Solved for ${variable}`
//         });

//         return {
//             problemType: 'Linear Equations',
//             originalProblem: input,
//             steps,
//             finalAnswer: `${variable} = ${solution}`
//         };
//     } catch (error) {
//         throw new Error('Error solving linear equation: ' + error.message);
//     }
// }

// // 3. Quadratic Equations Solver
// function solveQuadraticEquations(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Original quadratic equation"
//     });

//     try {
//         const cleanInput = input.replace(/(\*{2,}|\^{2,})/g, '^');
//         const [lhs, rhs] = cleanInput.split('=').map(s => s.trim());
//         const equation = `${lhs} - (${rhs})`;
//         const simplified = mathjs.simplify(equation);
//         steps.push({
//             equation: `${simplified.toString()} = 0`,
//             explanation: "Standard form"
//         });

//         // Use helper to get coefficients
//         const coeffs = getQuadraticCoefficients(simplified);

//         const a = coeffs.a || 0;
//         const b = coeffs.b || 0;
//         const c = coeffs.c || 0;

//         steps.push({
//             equation: `Coefficients: a = ${a}, b = ${b}, c = ${c}`,
//             explanation: "Identified coefficients"
//         });

//         const discriminant = b * b - 4 * a * c;
//         steps.push({
//             equation: `Discriminant = b² - 4ac = ${discriminant}`,
//             explanation: "Calculated discriminant"
//         });

//         if (discriminant > 0) {
//             const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
//             const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);

//             steps.push({
//                 equation: `x₁ = ${x1.toFixed(3)}, x₂ = ${x2.toFixed(3)}`,
//                 explanation: "Two real solutions"
//             });

//             return {
//                 problemType: 'Quadratic Equations',
//                 originalProblem: input,
//                 steps,
//                 finalAnswer: `x₁ = ${x1.toFixed(3)}, x₂ = ${x2.toFixed(3)}`
//             };
//         } else if (discriminant === 0) {
//             const x = -b / (2 * a);
//             steps.push({
//                 equation: `x = ${x.toFixed(3)}`,
//                 explanation: "One real solution (repeated root)"
//             });

//             return {
//                 problemType: 'Quadratic Equations',
//                 originalProblem: input,
//                 steps,
//                 finalAnswer: `x = ${x.toFixed(3)}`
//             };
//         } else {
//             steps.push({
//                 equation: "No real solutions (complex roots)",
//                 explanation: "Discriminant is negative"
//             });

//             return {
//                 problemType: 'Quadratic Equations',
//                 originalProblem: input,
//                 steps,
//                 finalAnswer: "No real solutions"
//             };
//         }
//     } catch (error) {
//         throw new Error('Error solving quadratic equation: ' + error.message);
//     }
// }

// function getQuadraticCoefficients(expr, variable = 'x') {
//     const a = mathjs.derivative(mathjs.derivative(expr, variable), variable).evaluate({ [variable]: 1 }) / 2;
//     const b = mathjs.derivative(expr, variable).evaluate({ [variable]: 0 });
//     const c = expr.evaluate({ [variable]: 0 });

//     return { a, b, c };
// }

// // 4. Fractions Solver
// function solveFractions(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Original fraction expression"
//     });

//     try {
//         // Parse input: e.g. "1/3 + 1/6"
//         const [frac1, operator, frac2] = input.split(' ');

//         if (operator !== '+') {
//             throw new Error('Currently only supports addition');
//         }

//         // Parse numerator and denominator for both fractions
//         const [n1, d1] = frac1.split('/').map(Number);
//         const [n2, d2] = frac2.split('/').map(Number);

//         // Step 1: Find LCM of denominators
//         const lcm = mathjs.lcm(d1, d2);
//         steps.push({
//             equation: `LCM(${d1}, ${d2}) = ${lcm}`,
//             explanation: "Find least common denominator"
//         });

//         // Step 2: Convert to equivalent fractions with LCM as denominator
//         const newN1 = n1 * (lcm / d1);
//         const newN2 = n2 * (lcm / d2);
//         steps.push({
//             equation: `${frac1} = ${newN1}/${lcm}, ${frac2} = ${newN2}/${lcm}`,
//             explanation: "Convert fractions to have the same denominator"
//         });

//         // Step 3: Add numerators
//         const sumN = newN1 + newN2;
//         steps.push({
//             equation: `${newN1}/${lcm} + ${newN2}/${lcm} = ${sumN}/${lcm}`,
//             explanation: "Add numerators over common denominator"
//         });

//         // Step 4: Simplify the fraction
//         const gcd = mathjs.gcd(sumN, lcm);
//         const simpN = sumN / gcd;
//         const simpD = lcm / gcd;
//         const simplified = `${simpN}/${simpD}`;
//         steps.push({
//             equation: `${sumN}/${lcm} = ${simplified}`,
//             explanation: "Simplify the fraction"
//         });

//         // Step 5: Decimal approximation if denominator != 1
//         if (simpD !== 1) {
//             const decimal = (simpN / simpD).toFixed(4);
//             steps.push({
//                 equation: `≈ ${decimal}`,
//                 explanation: "Decimal approximation"
//             });
//         }

//         return {
//             problemType: 'Fractions Addition',
//             originalProblem: input,
//             steps,
//             finalAnswer: simplified
//         };

//     } catch (error) {
//         throw new Error('Invalid fraction expression or unsupported operation');
//     }
// }

// // 5. Percentages Solver
// function solvePercentages(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Solving percentage problem"
//     });

//     try {
//         // Handle different percentage formats
//         let processedInput = input.replace(/of/gi, '*');
//         processedInput = processedInput.replace(/(\d+)%/g, '($1/100)');

//         if (processedInput !== input) {
//             steps.push({
//                 equation: processedInput,
//                 explanation: "Converted percentage to decimal"
//             });
//         }

//         const result = mathjs.evaluate(processedInput);
//         steps.push({
//             equation: `= ${result}`,
//             explanation: "Final result"
//         });

//         return {
//             problemType: 'Percentages',
//             originalProblem: input,
//             steps,
//             finalAnswer: result.toString()
//         };
//     } catch (error) {
//         throw new Error('Invalid percentage expression');
//     }
// }

// // 7. Exponents Solver
// function solveExponents(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Solving exponential expression"
//     });

//     try {
//         // Convert ** to ^ for consistency
//         const processedInput = input.replace(/\*\*/g, '^');

//         if (processedInput !== input) {
//             steps.push({
//                 equation: processedInput,
//                 explanation: "Standardized exponent notation"
//             });
//         }

//         const result = mathjs.evaluate(processedInput);
//         steps.push({
//             equation: `= ${result}`,
//             explanation: "Calculated exponential result"
//         });

//         return {
//             problemType: 'Exponents',
//             originalProblem: input,
//             steps,
//             finalAnswer: result.toString()
//         };
//     } catch (error) {
//         throw new Error('Invalid exponential expression');
//     }
// }

// // 10. Factorial Solver
// function solveFactorial(input) {
//     const steps = [];
//     steps.push({
//         equation: input,
//         explanation: "Calculating factorial"
//     });

//     try {
//         const match = input.match(/(\d+)!/);
//         if (!match) {
//             throw new Error('Invalid factorial format');
//         }

//         const n = parseInt(match[1]);
//         if (n < 0) {
//             throw new Error('Factorial is not defined for negative numbers');
//         }

//         let result = 1;
//         let calculation = [];

//         for (let i = n; i >= 1; i--) {
//             result *= i;
//             calculation.push(i);
//         }

//         steps.push({
//             equation: `${n}! = ${calculation.join(' × ')} = ${result}`,
//             explanation: "Factorial calculation"
//         });

//         return {
//             problemType: 'Factorial',
//             originalProblem: input,
//             steps,
//             finalAnswer: result.toString()
//         };
//     } catch (error) {
//         throw new Error('Error calculating factorial: ' + error.message);
//     }
// }

// // Enhanced image preprocessing specifically for mathematical equations
// async function preprocessImage(imagePath) {
//     try {
//         const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');

//         // Get image metadata first
//         const metadata = await sharp(imagePath).metadata();
//         const targetHeight = Math.max(1600, metadata.height * 3); // Higher resolution for better OCR

//         await sharp(imagePath)
//             // Resize with high-quality interpolation
//             .resize(null, targetHeight, {
//                 withoutEnlargement: false,
//                 kernel: sharp.kernel.lanczos3
//             })
//             // Convert to grayscale
//             .grayscale()
//             // Aggressive contrast enhancement for bold text
//             .linear(2.5, -(128 * 2.5) + 128) // Very high contrast
//             .gamma(0.6) // Lower gamma for better bold text recognition
//             // Morphological operations to clean up thick text
//             .convolve({
//                 width: 3,
//                 height: 3,
//                 kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1] // Sharpen kernel
//             })
//             // Normalize and apply threshold
//             .normalize()
//             .threshold(100) // Lower threshold for thick text
//             // Final enhancement
//             .sharpen({ sigma: 1.5, m1: 1, m2: 3, x1: 3, y1: 15 })
//             .png({ quality: 100, compressionLevel: 0 })
//             .toFile(outputPath);

//         return outputPath;
//     } catch (error) {
//         console.error('Image preprocessing error:', error);
//         return imagePath;
//     }
// }

// // Create multiple processed versions for ensemble OCR
// async function createMultipleProcessedVersions(imagePath) {
//     const versions = [];
//     const baseName = imagePath.replace(/\.[^/.]+$/, '');

//     try {
//         // Version 1: Ultra high contrast for bold text
//         const ultraHighContrastPath = `${baseName}_ultra_high_contrast.png`;
//         await sharp(imagePath)
//             .resize(null, 1800, { withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
//             .grayscale()
//             .linear(3.0, -200) // Extreme contrast for thick text
//             .threshold(80) // Very low threshold
//             .png()
//             .toFile(ultraHighContrastPath);
//         versions.push(ultraHighContrastPath);

//         // Version 2: Morphological processing for thick characters
//         const morphologyPath = `${baseName}_morphology.png`;
//         await sharp(imagePath)
//             .resize(null, 1800, { withoutEnlargement: false })
//             .grayscale()
//             .convolve({
//                 width: 3,
//                 height: 3,
//                 kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0] // Edge enhancement
//             })
//             .linear(2.0, -100)
//             .threshold(90)
//             .png()
//             .toFile(morphologyPath);
//         versions.push(morphologyPath);

//         // Version 3: Original preprocessing
//         const standardPath = await preprocessImage(imagePath);
//         versions.push(standardPath);

//         return versions;
//     } catch (error) {
//         console.error('Error creating multiple versions:', error);
//         return [imagePath];
//     }
// }

// // Enhanced OCR with multiple engines and voting
// async function extractTextFromImage(imagePath) {
//     try {

//         // Create multiple processed versions
//         const processedVersions = await createMultipleProcessedVersions(imagePath);
//         const results = [];

//         // OCR with different configurations optimized for equations
//         const ocrConfigs = [
//             // Configuration 1: Specialized for mathematical expressions
//             {
//                 lang: 'eng',
//                 options: {
//                     tessedit_char_whitelist: '0123456789+-*/=()[]{}^.x²³⁴⁵⁶⁷⁸⁹⁰',
//                     tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
//                     preserve_interword_spaces: '0',
//                     tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
//                 }
//             },
//             // Configuration 2: Allow more characters including variables
//             {
//                 lang: 'eng',
//                 options: {
//                     tessedit_char_whitelist: '0123456789+-*/=()[]{}^.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ²³⁴⁵⁶⁷⁸⁹⁰',
//                     tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
//                     preserve_interword_spaces: '1',
//                     tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
//                 }
//             },
//             // Configuration 3: Default with high DPI assumption
//             {
//                 lang: 'eng',
//                 options: {
//                     tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
//                     tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
//                     user_defined_dpi: '300'
//                 }
//             },
//             // Configuration 4: Specialized for superscripts
//             {
//                 lang: 'eng',
//                 options: {
//                     tessedit_char_whitelist: '0123456789+-*/=()x²³⁴⁵⁶⁷⁸⁹⁰',
//                     tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD,
//                     preserve_interword_spaces: '0'
//                 }
//             }
//         ];

//         // Run OCR on each version with each configuration
//         for (const imagePath of processedVersions) {
//             for (const config of ocrConfigs) {
//                 try {
//                     const { data: { text, confidence } } = await Tesseract.recognize(
//                         imagePath,
//                         config.lang,
//                         {
//                             logger: m => {
//                                 if (m.status === 'recognizing text') {
//                                 }
//                             },
//                             ...config.options
//                         }
//                     );

//                     if (text.trim() && confidence > 30) {
//                         results.push({
//                             text: text.trim(),
//                             confidence: confidence,
//                             source: `${imagePath}_${config.lang}_${config.options.tessedit_pageseg_mode || 'auto'}`
//                         });
//                     }
//                 } catch (ocrError) {
//                     console.warn('OCR attempt failed:', ocrError.message);
//                 }
//             }
//         }

//         // Clean up processed images
//         for (const path of processedVersions) {
//             if (path !== imagePath && fs.existsSync(path)) {
//                 fs.unlinkSync(path);
//             }
//         }

//         if (results.length === 0) {
//             throw new Error('No OCR results obtained');
//         }

//         // Find the best result using ensemble voting
//         const bestResult = findBestResult(results);

//         return cleanMathExpression(bestResult.text);
//     } catch (error) {
//         console.error('OCR Error:', error);
//         throw new Error('Failed to extract text from image');
//     }
// }

// // Ensemble voting to find the best result
// function findBestResult(results) {
//     if (results.length === 1) return results[0];

//     // Group similar results
//     const groups = [];
//     const threshold = 0.7; // Similarity threshold

//     for (const result of results) {
//         let addedToGroup = false;

//         for (const group of groups) {
//             const similarity = calculateSimilarity(result.text, group[0].text);
//             if (similarity >= threshold) {
//                 group.push(result);
//                 addedToGroup = true;
//                 break;
//             }
//         }

//         if (!addedToGroup) {
//             groups.push([result]);
//         }
//     }

//     // Find the group with highest combined confidence
//     let bestGroup = groups[0];
//     let bestScore = 0;

//     for (const group of groups) {
//         const avgConfidence = group.reduce((sum, r) => sum + r.confidence, 0) / group.length;
//         const groupScore = avgConfidence * group.length; // Weight by group size

//         if (groupScore > bestScore) {
//             bestScore = groupScore;
//             bestGroup = group;
//         }
//     }

//     // Return the result with highest confidence from the best group
//     return bestGroup.reduce((best, current) =>
//         current.confidence > best.confidence ? current : best
//     );
// }

// // Calculate text similarity using Levenshtein distance
// function calculateSimilarity(str1, str2) {
//     const len1 = str1.length;
//     const len2 = str2.length;
//     const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

//     for (let i = 0; i <= len1; i++) matrix[0][i] = i;
//     for (let j = 0; j <= len2; j++) matrix[j][0] = j;

//     for (let j = 1; j <= len2; j++) {
//         for (let i = 1; i <= len1; i++) {
//             if (str1[i - 1] === str2[j - 1]) {
//                 matrix[j][i] = matrix[j - 1][i - 1];
//             } else {
//                 matrix[j][i] = Math.min(
//                     matrix[j - 1][i] + 1,    // deletion
//                     matrix[j][i - 1] + 1,    // insertion
//                     matrix[j - 1][i - 1] + 1 // substitution
//                 );
//             }
//         }
//     }

//     const maxLen = Math.max(len1, len2);
//     return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
// }

// // Enhanced math expression cleaning specifically for quadratic equations
// function cleanMathExpression(text) {

//     let cleaned = text
//         .replace(/\s+/g, ' ') // Normalize spaces
//         .replace(/[""''`]/g, '') // Remove quotes
//         .trim();

//     // Specific corrections for the equation type "6x² - 17x + 12 = 0"
//     const corrections = {
//         // Numbers that might be misread
//         'O': '0', 'o': '0', 'Q': '0', 'D': '0',
//         'I': '1', 'l': '1', '|': '1', 'i': '1', 'j': '1',
//         'Z': '2', 'z': '2',
//         'E': '3', 'ε': '3',
//         'A': '4', 'a': '4',
//         'S': '5', 's': '5', 'ş': '5',
//         'G': '6', 'g': '6', 'б': '6',
//         'T': '7', 't': '7', '?': '7',
//         'B': '8', 'b': '8', '&': '8',
//         'g': '9', 'q': '9',

//         // Variables that might be misread
//         'X': 'x', 'χ': 'x', '×': 'x', 'x': 'x',

//         // Operators
//         '—': '-', '–': '-', '_': '-', '−': '-',
//         '÷': '/', ':': '/',

//         // Superscripts (common in quadratic equations)
//         '²': '^2', '2': '2', // Keep regular 2 as is, only convert actual superscript
//         '³': '^3',

//         // Equals sign variations
//         '＝': '=', '≡': '=', '≈': '=',

//         // Brackets
//         '[': '(', ']': ')',
//         '{': '(', '}': ')',
//     };

//     // Apply corrections
//     for (const [wrong, correct] of Object.entries(corrections)) {
//         cleaned = cleaned.split(wrong).join(correct);
//     }

//     // Handle specific patterns for quadratic equations

//     // Fix coefficient patterns (number directly before x)
//     cleaned = cleaned.replace(/(\d+)\s*x/g, '$1x');

//     // Fix superscript patterns (x followed by superscript)
//     cleaned = cleaned.replace(/x\s*(\^?\d+)/g, 'x^$1');
//     cleaned = cleaned.replace(/x\s*²/g, 'x^2');
//     cleaned = cleaned.replace(/x\s*\^?\s*2/g, 'x^2');

//     // Handle operators with proper spacing
//     cleaned = cleaned.replace(/\s*\+\s*/g, ' + ');
//     cleaned = cleaned.replace(/\s*-\s*/g, ' - ');
//     cleaned = cleaned.replace(/\s*=\s*/g, ' = ');

//     // Remove extra spaces
//     cleaned = cleaned.replace(/\s+/g, ' ').trim();

//     // Handle the specific pattern we expect: "6x^2 - 17x + 12 = 0"
//     // Check if it matches expected quadratic form and fix common issues
//     const quadraticPattern = /(\d+)x\^?2?\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)\s*=\s*0/;
//     const match = cleaned.match(quadraticPattern);

//     if (match) {
//         const [, a, sign1, b, sign2, c] = match;
//         cleaned = `${a}x^2 ${sign1} ${b}x ${sign2} ${c} = 0`;
//     }

//     return cleaned;
// }

// // Validation function to check if the result makes mathematical sense
// function validateMathExpression(expression) {
//     // Check for balanced parentheses
//     let parenCount = 0;
//     for (const char of expression) {
//         if (char === '(') parenCount++;
//         if (char === ')') parenCount--;
//         if (parenCount < 0) return false;
//     }

//     if (parenCount !== 0) return false;

//     // Check for valid mathematical structure
//     const mathPattern = /^[\d\w\s\+\-\*\/\(\)\=\^\.\!\%√∫∑∏π]+$/;
//     return mathPattern.test(expression);
// }

// // Main function that combines everything
// async function accurateOCRForMath(imagePath) {
//     try {
//         const extractedText = await extractTextFromImage(imagePath);

//         if (!validateMathExpression(extractedText)) {
//             console.warn('Warning: Extracted text may not be a valid mathematical expression');
//         }

//         return extractedText;
//     } catch (error) {
//         console.error('Accurate OCR failed:', error);
//         throw error;
//     }
// }

// // API endpoint
// const mathSolver = async (req, res) => {
//     try {
//         const { equation, problem } = req.body;
//         let input = equation || problem;

//         // Check if image was uploaded
//         if (req.file && req.file.fieldname === 'mathImage') {

//             try {
//                 // Extract text from uploaded image
//                 const extractedText = await accurateOCRForMath(req.file.path);

//                 if (!extractedText) {
//                     // Clean up uploaded file
//                     fs.unlinkSync(req.file.path);
//                     return res.status(400).json({
//                         error: 'Could not extract text from the image. Please ensure the image contains clear mathematical expressions.',
//                         success: false
//                     });
//                 }

//                 // Clean the extracted text
//                 input = cleanMathExpression(extractedText);

//                 // Clean up uploaded file after processing
//                 fs.unlinkSync(req.file.path);

//             } catch (imageError) {
//                 // Clean up uploaded file in case of error
//                 if (req.file && fs.existsSync(req.file.path)) {
//                     fs.unlinkSync(req.file.path);
//                 }
//                 return res.status(400).json({
//                     error: 'Error processing image: ' + imageError.message,
//                     success: false
//                 });
//             }
//         }

//         if (!input) {
//             return res.status(400).json({
//                 error: 'Math problem, equation, or image is required',
//                 success: false
//             });
//         }

//         const solution = identifyAndSolveMathProblem(input);

//         return res.json({
//             ...solution,
//             extractedFromImage: !!req.file,
//             extractedText: req.file ? input : undefined,
//             success: true
//         });

//     } catch (error) {
//         // Clean up uploaded file in case of error
//         if (req.file && fs.existsSync(req.file.path)) {
//             fs.unlinkSync(req.file.path);
//         }

//         res.status(400).json({
//             error: error.message,
//             success: false
//         });
//     }
// };

// module.exports = { mathSolver };