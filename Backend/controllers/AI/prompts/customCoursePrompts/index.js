const coursePrompts = require("./customCourseGeneratorPrompt");

const prompts = {
  course: coursePrompts
};

function getPrompt(templateKey, variables = {}) {
  let template = templateKey.split(".").reduce((o, i) => o[i], prompts);

  Object.keys(variables).forEach(key => {
    template = template.replace(new RegExp(`{${key}}`, "g"), variables[key]);
  });

  return template;
}

module.exports = { getPrompt };
