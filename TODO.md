# TODO

## Immediate Goals
- [ ] Add an embedded app database for projects, videos, scene dissections, style selections, and scene-mapping output.
- [ ] Make "Get Started" open the active Kanban board for videos currently being worked on.
- [ ] Rename "Scene Mapper" to "Scene Segmentation" in the UI, navigation labels, and any user-facing docs.

## App Logic Gaps To Resolve
- [ ] Decide what "easily sharable" means in practice: export/import, local file transfer, or cloud sync.
- [ ] Define the real data model before wiring screens so the board is driven by stored records instead of hardcoded sample items.
- [ ] Decide whether the Kanban board is global across all videos or scoped to one project at a time.
- [ ] Confirm whether route/file names should stay stable for now or be renamed along with the UI labels.

## Things This App Still Needs
- [ ] Persistence for the full workflow: uploaded video, scene breakdown, style choices, and final outputs.
- [ ] A seed or onboarding state so the board is useful on first launch.
- [ ] Empty states, loading states, and error states for when there are no projects yet or storage is unavailable.
- [ ] A migration plan so any existing data survives the database change and the rename.

## Nice To Have After The Core Setup
- [ ] Search and filter for projects/videos.
- [ ] Exportable project bundles for sharing.
- [ ] Clear status labels for each stage so the board reflects actual work in progress.
