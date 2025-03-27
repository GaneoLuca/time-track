import { useState, useEffect } from "react";

const Card = ({ children }) => <div className="border rounded p-4 mb-2">{children}</div>;
const CardContent = ({ children }) => <div>{children}</div>;
const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded" {...props}>{children}</button>
);

export default function TimeTracker() {
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [logs, setLogs] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const savedLogs = localStorage.getItem("logs");
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    let timer;
    if (startTime) {
      timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const startTask = () => {
    if (!taskName) return;
    const now = Date.now();
    setStartTime(now);
    setActiveTask({ taskName, description });
    setElapsed(0);
  };

  const stopTask = () => {
    if (!activeTask || !startTime) return;
    const endTime = new Date();
    const durationSec = Math.floor((endTime - startTime) / 1000);
    const newLog = {
      task: activeTask.taskName,
      description: description,
      start: new Date(startTime).toLocaleTimeString(),
      end: endTime.toLocaleTimeString(),
      duration: formatDuration(durationSec),
      seconds: durationSec
    };
    setLogs([newLog, ...logs]);
    setActiveTask(null);
    setStartTime(null);
    setTaskName("");
    setDescription("");
    setElapsed(0);
  };

  const downloadCSV = () => {
    const header = "Commessa,Descrizione,Inizio,Fine,Durata\n";
    const rows = logs.map(log =>
      `${log.task},${log.description},${log.start},${log.end},${log.duration}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "riepilogo_commesse.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLogs = () => {
    if (confirm("Sei sicuro di voler cancellare tutti i log?")) {
      setLogs([]);
      localStorage.removeItem("logs");
    }
  };

  const totalTime = logs.reduce((sum, log) => sum + (log.seconds || 0), 0);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Time Tracker</h1>

      <input
        type="text"
        placeholder="Commessa"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        className="border p-2 w-full rounded mb-2"
      />

      <textarea
        placeholder="Descrizione"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full rounded mb-2"
        rows={2}
      />

      <div className="flex gap-2 mb-4">
        <Button onClick={startTask} disabled={!!activeTask || !taskName}>Start</Button>
        <Button onClick={stopTask} disabled={!activeTask}>Stop</Button>
        <Button onClick={downloadCSV} disabled={logs.length === 0}>Esporta CSV</Button>
        <Button onClick={clearLogs} disabled={logs.length === 0}>Cancella Tutto</Button>
      </div>

      {activeTask && (
        <p className="mb-4 text-green-600">⏱️ In corso: {activeTask.taskName} - {formatDuration(elapsed)}</p>
      )}

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Riepilogo</h2>
          {logs.length === 0 ? (
            <p>Nessuna attività registrata.</p>
          ) : (
            <>
              <ul className="space-y-2 mb-4">
                {logs.map((log, index) => (
                  <li key={index} className="border-b pb-2">
                    <strong>{log.task}</strong> ({log.duration})<br />
                    {log.description && <em>{log.description}</em>}<br />
                    {log.start} - {log.end}
                  </li>
                ))}
              </ul>
              <p className="font-medium">Totale: {formatDuration(totalTime)}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
