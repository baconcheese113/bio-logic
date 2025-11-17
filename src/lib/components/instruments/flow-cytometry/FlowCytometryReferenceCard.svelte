<script lang="ts">
  let isExpanded = $state(false);
</script>

<div class="reference-card">
  <button class="card-header" onclick={() => isExpanded = !isExpanded}>
    <span class="card-title">📋 Cell Type Reference Chart</span>
    <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
  </button>
  
  {#if isExpanded}
    <div class="card-content">
      <table class="reference-table">
        <thead>
          <tr>
            <th>Cell Type</th>
            <th>Forward Scatter (FSC)</th>
            <th>Side Scatter (SSC)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Debris/Dead Cells</td>
            <td>5-15</td>
            <td>5-15</td>
          </tr>
          <tr>
            <td>Bacteria</td>
            <td>10-30</td>
            <td>10-30</td>
          </tr>
          <tr>
            <td>Red Blood Cells</td>
            <td>15-25</td>
            <td>8-12</td>
          </tr>
          <tr>
            <td>Lymphocytes</td>
            <td>40-55</td>
            <td>20-40</td>
          </tr>
          <tr>
            <td>Epithelial Cells</td>
            <td>45-60</td>
            <td>35-50</td>
          </tr>
          <tr>
            <td>Monocytes</td>
            <td>55-70</td>
            <td>40-60</td>
          </tr>
          <tr>
            <td>Neutrophils</td>
            <td>60-75</td>
            <td>65-85</td>
          </tr>
        </tbody>
      </table>
      <div class="reference-note">
        <strong>Note:</strong> Values are normalized to 0-100 scale. FSC (size) and SSC (granularity/complexity) help distinguish cell populations.
      </div>
    </div>
  {/if}
</div>

<style>
  .reference-card {
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    overflow: hidden;
  }

  .card-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: none;
    color: #ccc;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
  }

  .card-header:hover {
    background: #3a3a3a;
  }

  .card-title {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.85rem;
  }

  .expand-icon {
    color: #888;
  }

  .card-content {
    padding: 0.75rem;
  }

  .reference-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .reference-table thead {
    background: #2a2a2a;
  }

  .reference-table th {
    padding: 0.5rem;
    text-align: left;
    color: #6a9fb5;
    font-weight: bold;
    border-bottom: 2px solid #4a4a4a;
  }

  .reference-table td {
    padding: 0.5rem;
    color: #ccc;
    border-bottom: 1px solid #2a2a2a;
  }

  .reference-table tbody tr:hover {
    background: #2a2a2a;
  }

  .reference-note {
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: #0a0a0a;
    border-left: 3px solid #6a9fb5;
    color: #888;
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .reference-note strong {
    color: #6a9fb5;
  }
</style>
