<script lang="ts">
  import StageArea from "../../shared/StageArea.svelte";
  import AgglutinationSlide from "./AgglutinationSlide.svelte";
  import HoverInfoPanel from "../../shared/HoverInfoPanel.svelte";
  import CollapsibleSection from "../../shared/CollapsibleSection.svelte";
  import InstrumentRightPanel from "../../shared/InstrumentRightPanel.svelte";
  import {
    evidence,
    setBloodType,
    setRhFactor,
    setSyphilisAntibodies,
    setDiphtheriaAntitoxin,
  } from "../../../stores/evidence";
  import { currentCase } from "../../../stores/game-state";
  import { instrumentState } from "../../../stores/instrument-state";
  import { createInstrumentHelpers } from "../../../stores/instrument-helpers";
  import {
    startBackgroundProcess,
    getInstrumentProcess,
    isProcessComplete,
    completeProcess,
  } from "../../../stores/timer-service";
  import { currentActiveCase } from "../../../stores/active-cases";

  const { hasSampleLoaded } = createInstrumentHelpers("serology");

  let currentTest = $state<
    "anti-a" | "anti-b" | "anti-d" | "syphilis" | "diphtheria" | null
  >(null);
  let testResult = $state<"positive" | "negative">("negative");
  let lastHoveredInfo = $state<string | null>(null);
  let rightPanelRef = $state<InstrumentRightPanel>();
  let activeProcessId = $state<string | null>(null);

  // Get current case ID for timer-service
  const caseId = $derived($currentActiveCase?.caseId ?? "");
  
  // Processing state - check if there's an active process for serology
  const serologyProcess = $derived(getInstrumentProcess("serology"));
  const isRunning = $derived(!!serologyProcess && !isProcessComplete(serologyProcess));

  const tests = [
    { value: "anti-a" as const, label: "Anti-A Serum", infoKey: "test-anti-a" },
    { value: "anti-b" as const, label: "Anti-B Serum", infoKey: "test-anti-b" },
    {
      value: "anti-d" as const,
      label: "Anti-D Serum (Rh)",
      infoKey: "test-rh",
    },
    {
      value: "syphilis" as const,
      label: "Syphilis (RPR)",
      infoKey: "test-syphilis",
    },
    {
      value: "diphtheria" as const,
      label: "Diphtheria Antitoxin",
      infoKey: "test-diphtheria",
    },
  ];

  // Track which tests have been run
  let antiAResult = $state<"positive" | "negative" | null>(null);
  let antiBResult = $state<"positive" | "negative" | null>(null);

  function selectTest(test: typeof currentTest) {
    if (currentTest === test || !caseId) {
      currentTest = null;
      return;
    }

    currentTest = test;
    testResult = "negative"; // Default to negative

    const sampleId = $instrumentState.activeSamples["serology"] ?? "";
    
    // Start incubation process using timer-service (3 seconds)
    activeProcessId = startBackgroundProcess(caseId, "serology", sampleId, "Incubating", 3000);
    
    // Set timeout to complete and calculate result
    setTimeout(() => {
      if (activeProcessId) {
        completeProcess(activeProcessId);
        activeProcessId = null;
      }
      calculateResult();
    }, 3000);
  }

  function calculateResult() {
    if (!currentTest) return;

    // For blood typing cases, simulate correct agglutination based on case answer
    if ($currentCase.answerFormat === "blood-typing") {
      const correctBloodType = $currentCase.correctAnswer; // e.g., "A+", "O-", "AB+"
      const baseType = correctBloodType.replace("+", "").replace("-", ""); // Strip Rh

      if (currentTest === "anti-a") {
        // Agglutinates if blood has A antigen (A or AB)
        testResult =
          baseType === "A" || baseType === "AB" ? "positive" : "negative";
      } else if (currentTest === "anti-b") {
        // Agglutinates if blood has B antigen (B or AB)
        testResult =
          baseType === "B" || baseType === "AB" ? "positive" : "negative";
      } else if (currentTest === "anti-d") {
        // Agglutinates if Rh positive
        testResult = correctBloodType.includes("+") ? "positive" : "negative";
      }
    } else if ($currentCase.answerFormat === "immunity-screening") {
      if (currentTest === "diphtheria") {
        testResult =
          $currentCase.correctAnswer === "immune" ? "positive" : "negative";
      }
    } else if ($currentCase.answerFormat === "syphilis-detection") {
      if (currentTest === "syphilis") {
        testResult =
          $currentCase.correctAnswer === "positive" ? "positive" : "negative";
      }
    }
  }

  function recordAntiAResult(result: "positive" | "negative") {
    antiAResult = result;
    updateBloodTypeFromTests();
  }

  function recordAntiBResult(result: "positive" | "negative") {
    antiBResult = result;
    updateBloodTypeFromTests();
  }

  function updateBloodTypeFromTests() {
    // Determine ABO type from test results
    if (antiAResult === "positive" && antiBResult === "positive") {
      setBloodType("AB");
    } else if (antiAResult === "positive" && antiBResult === "negative") {
      setBloodType("A");
    } else if (antiAResult === "negative" && antiBResult === "positive") {
      setBloodType("B");
    } else {
      setBloodType("O");
    }
  }

  function recordRhFactor(isPositive: boolean) {
    setRhFactor(isPositive);
  }

  function recordSyphilis(hasAntibodies: boolean) {
    setSyphilisAntibodies(hasAntibodies);
  }

  function recordDiphtheria(hasAntitoxin: boolean) {
    setDiphtheriaAntitoxin(hasAntitoxin);
  }

  let showTestsSection = $state(true);
  let showObservationsSection = $state(true);

  function setHoveredInfo(key: string) {
    lastHoveredInfo = key;
  }
</script>

<div class="serology-view">
  <div class="stage-container">
    <StageArea showCaseHeader={true}>
      <div
        class="slide-container"
        class:clickable={!$hasSampleLoaded}
        onclick={() =>
          !$hasSampleLoaded && rightPanelRef?.openInventoryForSample("serology")}
        role="button"
        tabindex="0"
        onkeydown={(e) =>
          !$hasSampleLoaded &&
          e.key === "Enter" &&
          rightPanelRef?.openInventoryForSample("serology")}
      >
        {#if isRunning}
          <div class="processing-overlay">
            <div class="spinner"></div>
            <div class="processing-text">Incubating...</div>
          </div>
        {/if}
        <AgglutinationSlide testType={currentTest} result={testResult} />
      </div>
    </StageArea>

    <HoverInfoPanel infoKey={lastHoveredInfo} />
  </div>

  <InstrumentRightPanel
    bind:this={rightPanelRef}
    instrument="serology"
  >
    {#if $hasSampleLoaded}
      <CollapsibleSection title="Serology Tests" bind:isOpen={showTestsSection}>
        <div class="test-grid">
          {#each tests as test}
            <button
              class="test-button"
              class:active={currentTest === test.value}
              disabled={isRunning}
              onclick={() => selectTest(test.value)}
              onmouseenter={() => setHoveredInfo(test.infoKey)}
            >
              {test.label}
            </button>
          {/each}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Record Results"
        bind:isOpen={showObservationsSection}
      >
        {#if currentTest === "anti-a"}
          <div class="obs-label">Anti-A Serum Result:</div>
          <div class="obs-buttons-grid">
            <button
              class="obs-button"
              class:active={antiAResult === "positive"}
              onclick={() => recordAntiAResult("positive")}
              onmouseenter={() => setHoveredInfo("agglutination")}
            >
              Agglutination (+)
            </button>
            <button
              class="obs-button"
              class:active={antiAResult === "negative"}
              onclick={() => recordAntiAResult("negative")}
              onmouseenter={() => setHoveredInfo("agglutination")}
            >
              No Agglutination (-)
            </button>
          </div>
          {#if antiAResult !== null}
            <div class="info-hint">
              Now test with Anti-B serum to determine blood type
            </div>
          {/if}
        {:else if currentTest === "anti-b"}
          <div class="obs-label">Anti-B Serum Result:</div>
          <div class="obs-buttons-grid">
            <button
              class="obs-button"
              class:active={antiBResult === "positive"}
              onclick={() => recordAntiBResult("positive")}
              onmouseenter={() => setHoveredInfo("agglutination")}
            >
              Agglutination (+)
            </button>
            <button
              class="obs-button"
              class:active={antiBResult === "negative"}
              onclick={() => recordAntiBResult("negative")}
              onmouseenter={() => setHoveredInfo("agglutination")}
            >
              No Agglutination (-)
            </button>
          </div>
          {#if antiBResult !== null && antiAResult === null}
            <div class="info-hint">
              Now test with Anti-A serum to determine blood type
            </div>
          {/if}
        {:else if currentTest === "anti-d"}
          <div class="obs-label">Anti-D (Rh) Result:</div>
          <div class="obs-buttons-grid">
            <button
              class="obs-button"
              class:active={$evidence.rhFactor === true}
              onclick={() => recordRhFactor(true)}
              onmouseenter={() => setHoveredInfo("rh-positive")}
            >
              Positive (+)
            </button>
            <button
              class="obs-button"
              class:active={$evidence.rhFactor === false}
              onclick={() => recordRhFactor(false)}
              onmouseenter={() => setHoveredInfo("rh-negative")}
            >
              Negative (-)
            </button>
          </div>
        {:else if currentTest === "syphilis"}
          <div class="obs-label">Antibodies Detected:</div>
          <div class="obs-buttons-grid">
            <button
              class="obs-button"
              class:active={$evidence.syphilisAntibodies === true}
              onclick={() => recordSyphilis(true)}
              onmouseenter={() => setHoveredInfo("syphilis-positive")}
            >
              Positive
            </button>
            <button
              class="obs-button"
              class:active={$evidence.syphilisAntibodies === false}
              onclick={() => recordSyphilis(false)}
              onmouseenter={() => setHoveredInfo("syphilis-negative")}
            >
              Negative
            </button>
          </div>
        {:else if currentTest === "diphtheria"}
          <div class="obs-label">Antitoxin Present:</div>
          <div class="obs-buttons-grid">
            <button
              class="obs-button"
              class:active={$evidence.diphtheriaAntitoxin === true}
              onclick={() => recordDiphtheria(true)}
              onmouseenter={() => setHoveredInfo("diphtheria-immune")}
            >
              Immune
            </button>
            <button
              class="obs-button"
              class:active={$evidence.diphtheriaAntitoxin === false}
              onclick={() => recordDiphtheria(false)}
              onmouseenter={() => setHoveredInfo("diphtheria-not-immune")}
            >
              Not Immune
            </button>
          </div>
        {:else}
          <div class="info-hint">Select a test above to record results</div>
        {/if}
      </CollapsibleSection>
    {/if}
  </InstrumentRightPanel>
</div>

<style>
  .serology-view {
    width: 100%;
    height: 100%;
    display: flex;
    background: #1a1a1a;
  }

  .stage-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .slide-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slide-container.clickable {
    cursor: pointer;
    transition: transform 0.2s;
  }

  .slide-container.clickable:hover {
    transform: scale(1.02);
  }

  .test-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .test-button {
    background: #3a3a3a;
    color: #e0e0e0;
    border: 2px solid #5a5a5a;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .test-button:hover {
    background: #4a4a4a;
  }

  .test-button.active {
    background: #4a7c59;
    border-color: #5a8c69;
  }

  .obs-label {
    font-weight: bold;
    margin-bottom: 0.4rem;
    color: #b0b0b0;
    font-size: 0.85rem;
  }

  .obs-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .info-hint {
    text-align: center;
    color: #888;
    font-style: italic;
    padding: 1rem;
    font-size: 0.85rem;
  }

  .processing-overlay {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(74, 124, 89, 0.95);
    padding: 0.75rem 1.5rem;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  .processing-text {
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
