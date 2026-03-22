# Permanent Strategy Controls

Implement permanent PUSH, STD, and DEFEND buttons in the UI that can be triggered at any time during the race, with changes taking effect in the next lap and a 1-lap cooldown.

## Proposed Changes

### Backend (Python/FastAPI)

#### [MODIFY] [f1_sim.py](file:///Users/allenxu/Desktop/NUS%20S2%20Lec/AI%20in%20Marketing/Group%20project/f1_sim.py)
- Add `strategy_cooldown` to `Driver` class.
- Update `advance_lap` to decrement `strategy_cooldown`.
- Add `apply_strategy(action)` method to `F1Game` to update `push_mode` and set cooldown.

#### [MODIFY] [app.py](file:///Users/allenxu/Desktop/NUS%20S2%20Lec/AI%20in%20Marketing/Group%20project/app.py)
- Add `StrategyInput` BaseModel.
- Add `/api/strategy` endpoint.
- Include `strategy_cooldown` in `/api/advance` response.

### Frontend (React/Next.js)

#### [MODIFY] [broadcast-screen.tsx](file:///Users/allenxu/Desktop/NUS%20S2%20Lec/AI%20in%20Marketing/Group%20project/web_page_v1/components/f1/broadcast-screen.tsx)
- Move strategy buttons from `DecisionPanel` to a new permanent `StrategyControls` component.
- Add `strategyCooldown` state.
- Implement `handleStrategyChange` to hit the new API.
- Update UI to show cooldown status.

## Verification Plan

### Automated Tests
- Scripted API calls to `/api/strategy` to verify cooldown enforcement and `push_mode` updates.
- Verify that `strategy_cooldown` decreases after `/api/advance`.

### Manual Verification
- Test button clicks in the UI during a race simulation.
- Ensure buttons are disabled for 1 lap after a change.
- Verify that the radio message confirms the strategy change.
