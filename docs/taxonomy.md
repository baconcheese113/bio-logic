# BioLogic: Lab World Taxonomy

Quick reference for how everything in the game world is categorized and how items interact.

---

## Categories

### Structure
Building architecture. Defines the room shape. Cannot be changed after construction.

- Walls, floors, doors, windows, drains

### Fixture
Permanently installed lab infrastructure. Occupies floor tiles. Cannot be moved once placed. May require infrastructure hookups (gas, water, electric).

| Fixture | gridSize | Surface? | Storage? | Requires |
|---------|----------|----------|----------|----------|
| Built-in workbench | [2,1] | 4x2 | - | - |
| Large workbench | [3,1] | 6x2 | - | - |
| Plumbed sink | [1,1] | 2x1 | - | Water |
| Gas line | [1,1] | - | - | Gas |
| Fume hood | [2,1] | 3x2 | - | Ventilation |
| Wall shelving | [2,1] | - | 3x4 | - |

Fixtures with a **surface** provide a work area where benchtop equipment and consumables can be placed. Fixtures with **storage** provide enclosed slots for keeping items.

### Equipment
Movable machinery and tools. Can be purchased, placed, relocated, and sold.

| Equipment | gridSize | Placement | Stateful? |
|-----------|----------|-----------|-----------|
| Microscope | [2,2] | benchtop | Yes (loaded slide, focus) |
| Steam sterilizer | [2,2] | benchtop | Yes (cycle state) |
| Hand centrifuge | [2,1] | benchtop | Yes (loaded vials, spinning) |
| Staining rack | [2,1] | benchtop | Yes (loaded slides, stain) |
| Bunsen burner | [1,1] | benchtop | Yes (lit/unlit) |
| Inoculation loop | [1,1] | benchtop | No |
| Ice box | [2,2] | freeStanding | No |
| Incubator | [2,2] | freeStanding | Yes (contents, temp) |

- `benchtop` equipment must be placed on a fixture's work surface
- `freeStanding` equipment occupies floor tiles directly
- Any equipment can be stateful (tracks runtime state like loaded samples, temperature, etc.)

### Consumable
Depletable supplies. Used up during workflows. Stackable up to `maxStack`.

| Consumable | gridSize | maxStack |
|------------|----------|----------|
| Agar powder | [1,1] | 3 |
| Gelatin powder | [1,1] | 3 |
| Peptone | [1,1] | 3 |
| Defibrinated blood | [1,1] | 3 |
| Empty petri dish | [1,1] | 5 |
| Distilled water | [1,1] | 3 |
| Crystal violet | [1,1] | 3 |
| Safranin | [1,1] | 3 |

---

## Containers

A container is any item that can hold a substance inside it. This is a core mechanic — most lab workflows involve transferring substances between containers.

| Container | Holds | Capacity | Sealable |
|-----------|-------|----------|----------|
| Petri dish | Media, bacteria culture | 1 unit | Yes (lid) |
| Flask | Liquid reagents, mixed media | 5 units | Yes |
| Sample vial | Patient samples | 1 unit | Yes |
| Test tube | Reagents, samples | 2 units | Yes |
| Cassette | Tissue | 1 unit | No |

A petri dish starts empty. Pour media into it, and it becomes a culture plate. Streak bacteria onto it, incubate, and colonies grow. The dish is the container; the media + culture is its contents.

### Substances

Substances are what containers hold. They have a type and can carry metadata.

| Category | Examples |
|----------|---------|
| Patient samples | Blood, sputum, CSF, urine, stool, wound swab |
| Prepared media | Nutrient agar, blood agar, gelatin |
| Dry reagents | Agar powder, gelatin powder, peptone |
| Liquid reagents | Defibrinated blood, distilled water, stains |
| Cultures | Bacterial growth (tracks organism, density) |

---

## Shared Properties

All placeable things (fixtures, equipment, consumables) share:

```
gridSize: [cols, rows]    — space occupied (floor tiles or surface tiles)
```

Equipment and consumables additionally have:

```
placement: 'benchtop' | 'freeStanding'
maxStack: number          — 0 = not stackable
consumable: boolean       — depleted on use
container?: ContainerDef  — if it can hold substances
```

---

## Workbench Interaction

The workbench is a fixture with a work surface. When the player opens a workbench, they see a physical surface with items arranged on it. The player interacts with items directly on the surface:

- Move the inoculation loop over the bunsen burner to sterilize it
- Click a sample vial to pick up inoculum with the loop
- Tilt the plate lid and streak across the agar
- All interactions are physical and spatial, not menu-driven

Different workbench configurations create different workflows — a staining bench has a staining rack and slides, a culture bench has a burner and plates, a prep bench has flasks and reagent bottles. The workbench view is the same regardless; only the items on top change.
