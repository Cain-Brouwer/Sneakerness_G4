export default function TriggerErrorPage() {
  const shouldCrash = true;

  if (shouldCrash) {
    throw new Error("Handmatig getriggerde outage voor testdoeleinden");
  }

  return <div>Deze pagina zou normaal werken.</div>;
}
