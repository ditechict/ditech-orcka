import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageResponse } from "@/components/ai-elements/message";
import { supabase } from "@/integrations/supabase/client";

const WorkflowAdvisor = () => {
  const [industry, setIndustry] = useState("");
  const [currentTools, setCurrentTools] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const advise = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setRecommendation("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("workflow-advisor", {
        body: { industry, currentTools, workflow },
      });
      if (invokeError) {
        let message = "Recommendations are temporarily unavailable. Please try again.";
        if ("context" in invokeError && invokeError.context instanceof Response) {
          const body = await invokeError.context.clone().json().catch(() => null);
          if (typeof body?.error === "string") message = body.error;
        }
        setError(message);
        return;
      }
      if (typeof data?.recommendation !== "string" || !data.recommendation.trim()) {
        setError("No recommendations came back. Please try again.");
        return;
      }
      setRecommendation(data.recommendation);
    } catch {
      setError("Recommendations are temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-padding border-y border-border/60 bg-[hsl(var(--surface))]">
      <div className="container-custom max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <span className="kicker inline-flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> Workflow advisor</span>
            <h2 className="serif mt-4 text-4xl md:text-5xl brass-rule">Find the quiet work your systems can take on.</h2>
            <p className="mt-6 max-w-lg leading-relaxed text-muted-foreground">
              Describe one process that takes too much time. Get practical automation opportunities and a sensible place to start — no sign-in required.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              Please leave out passwords, personal records, and confidential customer information.
            </p>
          </div>

          <form onSubmit={advise} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="advisor-industry">Business or sector <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="advisor-industry" value={industry} onChange={(event) => setIndustry(event.target.value)} maxLength={120} placeholder="e.g. Retail, legal services" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advisor-tools">Tools you use <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="advisor-tools" value={currentTools} onChange={(event) => setCurrentTools(event.target.value)} maxLength={500} placeholder="e.g. Shopify, spreadsheets" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="advisor-workflow">What happens in the process?</Label>
              <Textarea
                id="advisor-workflow"
                value={workflow}
                onChange={(event) => setWorkflow(event.target.value)}
                minLength={25}
                maxLength={3000}
                required
                rows={6}
                placeholder="Where does the work begin? What steps repeat, who handles them, and where do delays or errors occur?"
                className="resize-y"
              />
              <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                <span>At least 25 characters</span><span>{workflow.length}/3,000</span>
              </div>
            </div>
            <Button type="submit" disabled={busy || workflow.trim().length < 25} className="w-full sm:w-auto">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Reviewing your workflow…</> : <>Explore opportunities <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
            </Button>
          </form>
        </div>

        {(recommendation || error || busy) && (
          <div className="mt-12 border-t border-border pt-8" aria-live="polite" aria-busy={busy}>
            {busy && <p className="text-sm text-muted-foreground">Considering the handoffs, repetitive steps, and tools in your process…</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {recommendation && (
              <div className="max-w-3xl">
                <h3 className="serif mb-5 text-2xl">A considered place to begin</h3>
                <MessageResponse>{recommendation}</MessageResponse>
                <Button asChild variant="link" className="mt-5 h-auto px-0">
                  <Link to="/contact">Discuss this workflow with DiTech <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default WorkflowAdvisor;