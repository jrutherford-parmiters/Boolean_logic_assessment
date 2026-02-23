const challenges = [
    // --- LEVEL 1: THE BASICS (1-6) ---
    {
        id: 0,
        title: "Q1: Gate Recognition",
        steps: [{
            type: "investigate",
            description: "Which gate only outputs '1' if BOTH inputs are '1'?",
            question: "Identify the gate:",
            options: ["AND", "OR", "NOT"],
            answer: 0
        }]
    },
    {
        id: 1,
        title: "Q2: Gate Recognition",
        steps: [{
            type: "investigate",
            description: "Which gate 'flips' the signal (turns 0 to 1)?",
            question: "Identify the gate:",
            options: ["AND", "OR", "NOT"],
            answer: 2
        }]
    },
    {
        id: 2,
        title: "Q3: Truth Table Check",
        steps: [{
            type: "investigate",
            description: "A gate has these inputs: [0,1]. The output is '1'. Which gate is it?",
            question: "Identify the gate:",
            options: ["AND", "OR"],
            answer: 1
        }]
    },
    {
        id: 3,
        title: "Q4: Build Foundation (AND)",
        steps: [{
            type: "build",
            description: "Build an AND gate circuit with 2 inputs and 1 output.",
            requiredInputs: 2, requiredOutputs: 1, requiredAND: 1,
            targetTruthTable: [0, 0, 0, 1]
        }]
    },
    {
        id: 4,
        title: "Q5: Build Foundation (OR)",
        steps: [{
            type: "build",
            description: "Build an OR gate circuit with 2 inputs and 1 output.",
            requiredInputs: 2, requiredOutputs: 1, requiredOR: 1,
            targetTruthTable: [0, 1, 1, 1]
        }]
    },
    {
        id: 5,
        title: "Q6: Build Foundation (NOT)",
        steps: [{
            type: "build",
            description: "Build a circuit where the light is ON when the switch is OFF.",
            requiredInputs: 1, requiredOutputs: 1, requiredNOT: 1,
            targetTruthTable: [1, 0]
        }]
    },

    // --- LEVEL 2: COMPARATORS (7-12) ---
    {
        id: 6,
        title: "Q7: Comparator Logic",
        steps: [{
            type: "investigate",
            description: "Which symbol means 'Greater Than'?",
            question: "Select symbol:",
            options: [">", "<", "="],
            answer: 0
        }]
    },
    {
        id: 7,
        title: "Q8: Evaluating Values",
        steps: [{
            type: "investigate",
            description: "If Input A = 10 and Input B = 10, what is the result of A ≠ B?",
            question: "Output is:",
            options: ["0 (False)", "1 (True)"],
            answer: 0
        }]
    },
    {
        id: 8,
        title: "Q9: Predict Output",
        steps: [{
            type: "investigate",
            description: "A comparator is set to 'Value < 50'. The input is 40. What is the output?",
            question: "Output is:",
            options: ["0", "1"],
            answer: 1
        }]
    },
    {
        id: 9,
        title: "Q10: Build a Sensor Check",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs '1' if an Input value is GREATER THAN 100.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0] // Logic checked via engine config
        }]
    },
    {
        id: 10,
        title: "Q11: Build Equality Check",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs '1' if an Input value is EXACTLY EQUAL TO 25.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0]
        }]
    },
    {
        id: 11,
        title: "Q12: Build Inverted Data",
        steps: [{
            type: "build",
            description: "Build a circuit that outputs '1' only if an Input value is NOT EQUAL TO 0.",
            requiredInputs: 1, requiredOutputs: 1, requiredComparators: 1,
            targetTruthTable: [0]
        }]
    },

    // --- LEVEL 3: DAISY CHAINING / COMPLEX (13-19) ---
    {
        id: 12,
        title: "Q13: Multiple Inputs",
        steps: [{
            type: "investigate",
            description: "To check if THREE inputs are all '1', how many AND gates do you need?",
            question: "Number of gates:",
            options: ["1", "2", "3"],
            answer: 1
        }]
    },
    {
        id: 13,
        title: "Q14: Pathfinding Logic",
        steps: [{
            type: "investigate",
            description: "In a circuit: (Input 1 AND Input 2) -> OR -> Input 3. If Input 3 is '1', does it matter what 1 and 2 are?",
            question: "Answer:",
            options: ["Yes, they must be 1", "No, the output will be 1 anyway"],
            answer: 1
        }]
    },
    {
        id: 14,
        title: "Q15: Complete the Table",
        steps: [{
            type: "investigate",
            description: "3-Input AND circuit. Inputs are [1, 1, 0]. What is the output?",
            question: "Output:",
            options: ["0", "1"],
            answer: 0
        }]
    },
    {
        id: 15,
        title: "Q16: Build 3-Input AND",
        steps: [{
            type: "build",
            description: "Build a circuit where 3 separate switches must all be ON to light the bulb.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 2,
            targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 1]
        }]
    },
    {
        id: 16,
        title: "Q17: Build 3-Input OR",
        steps: [{
            type: "build",
            description: "Build a circuit where the light turns on if ANY of the 3 switches are ON.",
            requiredInputs: 3, requiredOutputs: 1, requiredOR: 2,
            targetTruthTable: [0, 1, 1, 1, 1, 1, 1, 1]
        }]
    },
    {
        id: 17,
        title: "Q18: Manual Override Build",
        steps: [{
            type: "build",
            description: "Build a circuit: (Input 1 AND Input 2) OR Input 3.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 1, requiredOR: 1,
            targetTruthTable: [0, 1, 0, 1, 0, 1, 1, 1]
        }]
    },
    {
        id: 18,
        title: "Q19: The Emergency Stop",
        steps: [{
            type: "build",
            description: "Build: (Input 1 AND Input 2) AND (NOT Input 3). If Input 3 is 1, the output is always 0.",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 2, requiredNOT: 1,
            targetTruthTable: [0, 0, 0, 0, 0, 0, 1, 0]
        }]
    },

    // --- LEVEL 4: BODMAS & EXPRESSIONS (20-25) ---
    {
        id: 19,
        title: "Q20: Brackets First",
        steps: [{
            type: "investigate",
            description: "In the expression A AND (B OR C), which gate is processed first?",
            question: "First gate:",
            options: ["AND", "OR"],
            answer: 1
        }]
    },
    {
        id: 20,
        title: "Q21: BODMAS Logic",
        steps: [{
            type: "investigate",
            description: "Which expression means: 'Check A and B first, then OR the result with C'?",
            question: "Correct expression:",
            options: ["(A AND B) OR C", "A AND (B OR C)"],
            answer: 0
        }]
    },
    {
        id: 21,
        title: "Q22: Complex Prediction",
        steps: [{
            type: "investigate",
            description: "Expression: (1 OR 0) AND (0 OR 0). What is the output?",
            question: "Result:",
            options: ["0", "1"],
            answer: 0
        }]
    },
    {
        id: 22,
        title: "Q23: Build from Expression (Brackets)",
        steps: [{
            type: "build",
            description: "Build: (Input 1 OR Input 2) AND Input 3.",
            requiredInputs: 3, requiredOutputs: 1, requiredOR: 1, requiredAND: 1,
            targetTruthTable: [0, 0, 0, 1, 0, 1, 0, 1]
        }]
    },
    {
        id: 23,
        title: "Q24: Build from Expression (Double Brackets)",
        steps: [{
            type: "build",
            description: "Build: (Input 1 AND Input 2) OR (Input 3 AND Input 4).",
            requiredInputs: 4, requiredOutputs: 1, requiredAND: 2, requiredOR: 1,
            targetTruthTable: [0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1]
        }]
    },
    {
        id: 24,
        title: "Q25: The Master Logic",
        steps: [{
            type: "build",
            description: "Build the final expression: NOT ((Input 1 AND Input 2) OR Input 3).",
            requiredInputs: 3, requiredOutputs: 1, requiredAND: 1, requiredOR: 1, requiredNOT: 1,
            targetTruthTable: [1, 0, 1, 0, 1, 0, 0, 0]
        }]
    }
];