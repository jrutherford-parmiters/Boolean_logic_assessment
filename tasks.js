/* END OF MODULE ASSESSMENT: BOOLEAN LOGIC
   Total Questions: 25
   Replaces tasks.js 
*/

const challenges = [
    // --- PART 1: BASIC GATES (Q1 - Q6) ---
    {
        id: 0,
        title: "Question 1: Gate Identification",
        steps: [{
            type: "investigate",
            description: "Which logic gate only outputs a 1 (True) if BOTH of its inputs are 1?",
            question: "Identify the gate:",
            options: ["AND Gate", "OR Gate", "NOT Gate"],
            answer: 0
        }]
    },
    {
        id: 1,
        title: "Question 2: Truth Table Completion",
        steps: [{
            type: "investigate",
            description: "Look at this Truth Table: [Input: 0 -> Output: 1] and [Input: 1 -> Output: 0]. Which gate behaves this way?",
            question: "Identify the gate:",
            options: ["AND Gate", "OR Gate", "NOT Gate"],
            answer: 2
        }]
    },
    {
        id: 2,
        title: "Question 3: Logic Prediction",
        steps: [{
            type: "investigate",
            description: "An OR gate has Input A set to 1 and Input B set to 0. What is the output?",
            question: "Result:",
            options: ["0", "1"],
            answer: 1
        }]
    },
    {
        id: 3,
        title: "Question 4: Build Challenge (AND)",
        steps: [{
            type: "build",
            description: "Build a circuit with 2 Inputs, 1 AND gate, and 1 Output. Connect them to prove the truth table.",
            requiredInputs: 2, requiredOutputs: 1, requiredAND: 1,
            targetTruthTable: [0, 0, 0, 1]
        }]
    },
    {
        id: 4,
        title: "Question 5: Build Challenge (OR)",
        steps: [{
            type: "build",
            description: "Build a circuit with 2 Inputs, 1 OR gate, and 1 Output.",
            requiredInputs: 2, requiredOutputs: 1, requiredOR: 1,
            targetTruthTable: [0, 1, 1, 1]
        }]
    },
    {
        id: 5,
        title: "Question 6: Build Challenge (NOT)",
        steps: [{
            type: "build",
            description: "Build a circuit where the Output is always the OPPOSITE of the Input.",
            requiredInputs: 1, requiredOutputs: 1, requiredNOT: 1,
            targetTruthTable: [1, 0]
        }]
    },

    // --- PART 2: DATA & COMPARATORS (Q7 - Q12) ---
    {
        id: 6,
        title: "Question 7: Comparator Symbols",
        steps: [{
            type: "investigate",
            description: "Which mathematical symbol would you use to check if a temperature is colder than 15 degrees?",
            question: "Select symbol:",
            options: [">", "<", "="],
            answer: 1
        }]
    },
    {
        id: 7,
        title: "Question 8: Inequality Logic",
        steps: [{
            type: "investigate",
            description: "A comparator is set to 'Input ≠ 100'. If the input is 50, what is the Boolean output?",
            question: "Output:",
            options: ["0 (False)", "1 (True)"],
            answer: 1
        }]
    },
    {
        id: 8,
        title: "Question 9: Threshold Prediction",
        steps: [{
            type: "investigate",
            description: "If Input A = 25 and Input B = 20, which of these is True?",
            question: "Statement:",
            options: ["A < B", "A = B", "A > B"],
            answer: 2
        }]
    },
    {
        id: 9,
        title: "Question 10: Build a Comparator",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs 1 if the input value is GREATER THAN 50.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0] 
        }]
    },
    {
        id: 10,
        title: "Question 11: Build an Equality Check",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs 1 only if the input is EXACTLY 0.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0]
        }]
    },
    {
        id: 11,
        title: "Question 12: Build Inverted Data Logic",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs 1 if the input is NOT EQUAL TO 10.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0]
        }]
    },

    // --- PART 3: COMPLEX CIRCUITS / DAISY CHAINING (Q13 - Q19) ---
    {
        id: 12,
        title: "Question 13: Multiple Gate Logic",
        steps: [{
            type: "investigate",
            description: "To create a circuit with 3 inputs where ALL three must be 1 to turn on the light, how many AND gates are needed?",
            question: "Gate count:",
            options: ["1 gate", "2 gates", "3 gates"],
            answer: 1
        }]
    },
    {
        id: 13,
        title: "Question 14: The OR Path",
        steps: [{
            type: "investigate",
            description: "In a 'Daisy Chain' of OR gates, if ANY single input is 1, what happens to the final output?",
            question: "Final result:",
            options: ["It becomes 1", "It stays 0", "It depends on the first gate"],
            answer: 0
        }]
    },
    {
        id: 14,
        title: "Question 15: Identify the Truth Table",
        steps: [{
            type: "investigate",
            description: "A 3-input circuit has the result 1 only when inputs are [1, 1, 1]. All other combinations are 0. What gates are used?",
            question: "Logic Type:",
            options: ["Triple OR", "Triple AND", "AND + NOT"],
            answer: 1
        }]
    },
    {
        id: 15,
        title: "Question 16: Build 3-Input AND",
        steps: [{
            type: "build",
            description: "Build a circuit using 3 Inputs and 2 AND gates so that the output is 1 only when all inputs are 1.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 2,
            targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 1]
        }]
    },
    {
        id: 16,
        title: "Question 17: Build 3-Input OR",
        steps: [{
            type: "build",
            description: "Build a circuit using 3 Inputs and 2 OR gates so that any input turns the output to 1.",
            requiredInputs: 3, requiredOutputs: 1, requiredOR: 2,
            targetTruthTable: [0, 1, 1, 1, 1, 1, 1, 1]
        }]
    },
    {
        id: 17,
        title: "Question 18: Build Mixed Logic",
        steps: [{
            type: "build",
            description: "Build: (Input 1 AND Input 2) OR Input 3.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 1, requiredOR: 1,
            targetTruthTable: [0, 1, 0, 1, 0, 1, 1, 1]
        }]
    },
    {
        id: 18,
        title: "Question 19: Build the Inhibitor",
        steps: [{
            type: "build",
            description: "Build a circuit where Input 1 and 2 must be 1, but Input 3 MUST be 0 for the output to be 1.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 2, requiredNOT: 1,
            targetTruthTable: [0, 0, 0, 0, 0, 0, 1, 0]
        }]
    },

    // --- PART 4: EXPRESSIONS & BRACKETS (Q20 - Q25) ---
    {
        id: 19,
        title: "Question 20: Order of Operations",
        steps: [{
            type: "investigate",
            description: "In the expression: A OR (B AND C), which part is calculated first?",
            question: "Order:",
            options: ["A OR B", "B AND C"],
            answer: 1
        }]
    },
    {
        id: 20,
        title: "Question 21: Translating Brackets",
        steps: [{
            type: "investigate",
            description: "Which expression describes a circuit where Input 1 and 2 go into an OR gate first, then the result goes into an AND gate with Input 3?",
            question: "Expression:",
            options: ["(1 OR 2) AND 3", "1 OR (2 AND 3)"],
            answer: 0
        }]
    },
    {
        id: 21,
        title: "Question 22: Advanced Prediction",
        steps: [{
            type: "investigate",
            description: "Calculate: (1 AND 1) AND (NOT 1). What is the result?",
            question: "Result:",
            options: ["0", "1"],
            answer: 0
        }]
    },
    {
        id: 22,
        title: "Question 23: Build Expression A",
        steps: [{
            type: "build",
            description: "Build the circuit for: (Input 1 OR Input 2) AND Input 3.",
            requiredInputs: 3, requiredOutputs: 1, requiredOR: 1, requiredAND: 1,
            targetTruthTable: [0, 0, 0, 1, 0, 1, 0, 1]
        }]
    },
   {
           id: 23,
           title: "Question 24: Build Expression B",
           steps: [{
               type: "build",
               description: "Build the circuit for the expression:\n(Input 1 AND Input 2) OR (Input 3 AND Input 4)",
               requiredInputs: 4, 
               requiredOutputs: 1, 
               requiredAND: 2, 
               requiredOR: 1,
               targetTruthTable: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1]
           }]
       },
    {
        id: 24,
        title: "Question 25: The Master Circuit",
        steps: [{
            type: "build",
            description: "Build the final assessment circuit: NOT ((Input 1 AND Input 2) OR Input 3).",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 1, requiredOR: 1, requiredNOT: 1,
            targetTruthTable: [1, 0, 1, 0, 1, 0, 0, 0]
        }]
    }
];

