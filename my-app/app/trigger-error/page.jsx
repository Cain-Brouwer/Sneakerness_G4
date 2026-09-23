// Test page for forcing a runtime error intentionally.
// This is used to verify the error boundary and offline fallback screen work as expected.
export default function TriggerErrorPage() {
  const shouldCrash = true;

  if (shouldCrash) {
    throw new Error("Handmatig getriggerde outage voor testdoeleinden");
  }

  return <div>Deze pagina zou normaal werken.</div>;
}
