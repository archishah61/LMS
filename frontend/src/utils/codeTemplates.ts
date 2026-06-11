// Default code templates for each language
const DEFAULT_CODE_TEMPLATES = {
  python: `# Write your Python code here
print("Hello World")`,
  
  javascript: `// Write your JavaScript code here
console.log("Hello World");`,
  
  html: `<!DOCTYPE html>
<html>
<head>
  <title>HTML Example</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
  
  css: `/* Write your CSS code here */
body {
  font-family: Arial, sans-serif;
  margin: 20px;
}

h1 {
  color: navy;
}`,
  
  typescript: `// Write your TypeScript code here
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`,
  
  java: `// Write your Java code here
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}`,
  
  c: `// Write your C code here
#include <stdio.h>

int main() {
  printf("Hello World\\n");
  return 0;
}`,
  
  cpp: `// Write your C++ code here
#include <iostream>

int main() {
  std::cout << "Hello World" << std::endl;
  return 0;
}`,
  
  php: `<?php
// Write your PHP code here
echo "Hello World";
?>`,

  csharp: `// Write your C# code here
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World");
        }
    }
}`,

  go: `// Write your Go code here
package main

import "fmt"

func main() {
    fmt.Println("Hello World")
}`,

  dart: `// Write your Dart code here
void main() {
  print('Hello World');
}`,

  combined: {
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Combined Example</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a combined HTML, CSS, and JavaScript example.</p>
  <button id="demo-button">Click Me</button>
  <script src="script.js"></script>
</body>
</html>`,
    
    css: `body {
  font-family: Arial, sans-serif;
  margin: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #2c3e50;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}`,
    
    js: `document.addEventListener("DOMContentLoaded", function() {
  const button = document.getElementById("demo-button");
  
  button.addEventListener("click", function() {
    alert("Button clicked!");
  });
  
  console.log("Script loaded!");
});`
  }
};

export default DEFAULT_CODE_TEMPLATES;
