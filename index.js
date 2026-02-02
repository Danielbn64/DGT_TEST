"use strict";

const testContainer = document.getElementById("testContainer");
const startTest = document.getElementById("startTest");
const startTestOne = document.getElementById("startTestOne");
const startTestTwo = document.getElementById("startTestTwo");
const startTestThree = document.getElementById("startTestThree");
const finishTestbtn = document.getElementById("finishTestBtn");
const failedQuestionsTest = document.getElementById("failedQuestionsTest");

const testQuestionsjson = "./dgt_tests.json";
const testQuestionsjsonOne = "./dgt_tests1.json";
const testQuestionsjsonTwo = "./dgt_tests2.json";
const testQuestionsjsonThree = "./dgt_tests3.json";
const testQuestionsjsonFour = "./dgt_tests4.json";

let failedQuestions = [];
let answeredQuestionsCount = 0;
let typeTest = "normal";

const FAILED_QUESTIONS_KEY = "failedQuestions";

//Busca en la fuente de datos json del repositorio todas las preguntas y guarda en el almacenanmiento
// local 30 preguntas aleatorias, necesita como parametro una dirección de archivo json válida:
function searchTestQuestions(testQuestionsjson) {
  fetch(testQuestionsjson)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar el JSON");
      }
      return response.json();
    })
    .then((data) => {
      const copyData = [...data];
      for (let i = copyData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copyData[i], copyData[j]] = [copyData[j], copyData[i]];
      }
      let questionsSelected = copyData.slice(0, 30);
      //let questionsSelected = copyData;
      let questionsSelectedStrings = JSON.stringify(questionsSelected);
      localStorage.setItem("testQuestions", questionsSelectedStrings);
    })
    .catch((error) => {
      console.error(error);
    });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function saveFailedQuestions(questionData) {
  // Comprobamos si esta pregunta ya fue guardada
  const alreadySaved = failedQuestions.some(
    (q) => q.pregunta === questionData.pregunta
  );

  if (alreadySaved) return;

  // Clonamos el objeto para evitar mutaciones accidentales
  const questionClone = structuredClone(questionData);

  failedQuestions.push(questionClone);
}

function printTest(rawData) {
  const container = document.getElementById("testContainer");
  const questions = JSON.parse(rawData); //<--justo aquí
  let totalQuestions = questions.length;
  container.innerHTML = "";

  let counter = 0;
  questions.forEach((questionObj, questionIndex) => {
    counter++;
    // Extraemos la pregunta (solo hay una clave por objeto)
    //const questionData = Object.values(questionObj)[0];
    let questionData;

    // Caso 1: estructura original { pregunta84: { ... } }
    if (
      typeof questionObj === "object" &&
      !Array.isArray(questionObj) &&
      Object.keys(questionObj).length === 1 &&
      !questionObj.pregunta
    ) {
      questionData = Object.values(questionObj)[0];
    }
    // Caso 2: estructura ya plana (falladas)
    else {
      questionData = questionObj;
    }

    console.log(questionObj);
    const questionText =
      questionData.pregunta; /*<--no existe questionData.pregunta, questionData ya es el string*/
    const image = questionData.imagen;
    // Extraemos respuestas (ignoramos la clave "pregunta" y la clave "imagen")
    const answers = Object.entries(questionData)
      .filter(([key]) => key !== "pregunta" && key !== "imagen")
      .map(([, value]) => {
        return {
          questionId: value[0],
          text: value[1],
          correct: value[2],
        };
      });

    // Barajar respuestas (Fisher-Yates)
    shuffleArray(answers);

    // Crear HTML de la pregunta
    const questionHTML = document.createElement("div");
    questionHTML.className = "question";

    questionHTML.innerHTML = `
      <div class="image-container"><img src="${image}" class="image"/></div>
      <h3 class="title">${questionText}</h3>
      <div class="answers"></div>
    `;

    const answersContainer = questionHTML.querySelector(".answers");

    answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "answer-btn";
      button.textContent = answer.text;
      button.dataset.correct = answer.correct;

      button.addEventListener("click", () => {
        if (answersContainer.dataset.answered) return;

        answersContainer.dataset.answered = "true";

        if (answer.correct) {
          button.classList.add("correct");
        } else {
          saveFailedQuestions(questionData);
          console.log(failedQuestions);
          button.classList.add("incorrect");

          const correctBtn = answersContainer.querySelector(
            '[data-correct="true"]'
          );
          if (correctBtn) correctBtn.classList.add("correct");
        }
        answeredQuestionsCount++;

        if (answeredQuestionsCount === totalQuestions) {
          document.getElementById("finishTestBtn").disabled = false;
        }
      });

      answersContainer.appendChild(button);
    });

    container.appendChild(questionHTML);
  });
  console.log(counter);
}

function persistFailedQuestions() {
  // 1. Leer lo que ya existe
  const stored = localStorage.getItem(FAILED_QUESTIONS_KEY);
  const storedQuestions = stored ? JSON.parse(stored) : [];

  // 2. Unir antiguas + nuevas
  const combined = [...storedQuestions, ...failedQuestions];

  // 3. Eliminar duplicados por ID de pregunta
  const uniqueQuestions = [];
  const seenIds = new Set();

  combined.forEach((question) => {
    // Extraemos el ID desde cualquier respuesta
    const answers = Object.values(question).filter((v) => Array.isArray(v));

    const questionId = answers[0][0];

    if (!seenIds.has(questionId)) {
      seenIds.add(questionId);
      uniqueQuestions.push(question);
    }
  });

  // 4. Guardar de nuevo
  localStorage.setItem(FAILED_QUESTIONS_KEY, JSON.stringify(uniqueQuestions));
}

function updateFailedQuestions() {
  // Si no hay preguntas falladas, guardamos un array vacío
  if (!Array.isArray(failedQuestions)) {
    localStorage.setItem(FAILED_QUESTIONS_KEY, JSON.stringify([]));
    return;
  }

  localStorage.setItem(FAILED_QUESTIONS_KEY, JSON.stringify(failedQuestions));
}

startTest.addEventListener("click", () => {
  searchTestQuestions(testQuestionsjson);
  let rawData = localStorage.getItem("testQuestions");
  printTest(rawData);
});

startTestOne.addEventListener("click", () => {
  searchTestQuestions(testQuestionsjsonOne);
  let rawData = localStorage.getItem("testQuestions");
  printTest(rawData);
});

startTestTwo.addEventListener("click", () => {
  searchTestQuestions(testQuestionsjsonTwo);
  let rawData = localStorage.getItem("testQuestions");
  printTest(rawData);
});

startTestThree.addEventListener("click", () => {
  searchTestQuestions(testQuestionsjsonThree);
  let rawData = localStorage.getItem("testQuestions");
  printTest(rawData);
});

failedQuestionsTest.addEventListener("click", () => {
  typeTest = "review";
  let rawData = localStorage.getItem(FAILED_QUESTIONS_KEY);
  console.log(rawData);
  printTest(rawData);
});

finishTestbtn.addEventListener("click", () => {
  localStorage.removeItem("testQuestions");
  switch (typeTest) {
    case "normal":
      persistFailedQuestions();
      location.reload();
      break;
    case "review":
      updateFailedQuestions();
      location.reload();
      break;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const failedTestBtn = document.getElementById("failedQuestionsTest");
  const FAILED_QUESTIONS_KEY = "failedQuestions";

  const stored = localStorage.getItem(FAILED_QUESTIONS_KEY);

  if (!stored) return;

  try {
    const failedQuestions = JSON.parse(stored);

    if (Array.isArray(failedQuestions) && failedQuestions.length > 0) {
      failedTestBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error al leer preguntas falladas del localStorage");
  }
});
