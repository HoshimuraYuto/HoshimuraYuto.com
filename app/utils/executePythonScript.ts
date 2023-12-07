import { spawn } from "child_process";

const executePythonScript = (
  inputData: { id: string; content: string }[],
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", ["scripts/python/tfidf.py"]);

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    let output = "";

    pythonProcess.stdout.on("data", (data: string) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`エラー出力: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`プロセス終了コード: ${code}`);
        reject(`エラー終了: コード ${code}`);
      } else {
        resolve(output);
      }
    });
  });
};

export default executePythonScript;
