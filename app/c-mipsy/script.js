function App() {
  const [cCode, setCCode] = React.useState(`int main() {
    int a = 5, b = 3;
    int c = a + b;
    return c;
}`);
  const [mipsy, setMipsy] = React.useState("");

  const explainMap = {
    "int main()": "The program entry point → becomes main label in MIPS.",
    "int a = 5, b = 3;": "Variable declarations → stored in registers or memory.",
    "int c = a + b;": "Addition → translates to add instruction in MIPS.",
    "return c;": "Return → move result into $v0 and exit."
  };

  const convertCode = () => {
    const lines = cCode.split("\n");
    const output = lines.map(line => {
      let explanation = "";
      for (const [cSnippet, tip] of Object.entries(explainMap)) {
        if (line.includes(cSnippet)) {
          explanation = tip;
          break;
        }
      }
      return explanation
        ? `${line}\n    →   <span class="tooltip" data-tip="${explanation}">${mockMips(line)}</span>`
        : line;
    }).join("\n\n");
    setMipsy(output);
  };

  const mockMips = (line) => {
    if (line.includes("int a = 5")) return "li $t0, 5   # load immediate 5 into $t0";
    if (line.includes("b = 3")) return "li $t1, 3   # load immediate 3 into $t1";
    if (line.includes("c = a + b")) return "add $t2, $t0, $t1   # c = a+b";
    if (line.includes("return c")) return "move $v0, $t2   # return c";
    if (line.includes("main")) return "main:   # program entry";
    return "# [Unrecognized line]";
  };

  return (
    <div>
      <h1>C → MIPSy Learner</h1>
      <div className="container">
        <textarea
          value={cCode}
          onChange={(e) => setCCode(e.target.value)}
        />
        <div className="output" dangerouslySetInnerHTML={{ __html: mipsy }} />
      </div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        <button onClick={convertCode}>Convert</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
