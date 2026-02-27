export interface Entity {
    text: string;
    label: string;
}

function countByLabel(entities: Entity[]): { label: string; count: number }[] {
    const map = new Map<string, number>();
    for (const e of entities) {
        map.set(e.label, (map.get(e.label) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}

export function CompetencyMap({ entities }: { entities: Entity[] }) {
    if (!entities || entities.length === 0) return null;

    return (
        <div
            style={{
                background: 'var(--white)',
                border: '4px solid var(--fg)',
                boxShadow: 'var(--sh4)',
            }}
            aria-label="Extracted competencies"
        >
            {/* Header strip */}
            <div
                style={{
                    background: 'var(--fg)',
                    padding: '10px 16px',
                    fontFamily: 'var(--f)',
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'var(--yellow)',
                }}
            >
                Competency Map · Fastino + GLiNER
            </div>

            {/* Chips */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    padding: 16,
                }}
            >
                {entities.map((entity, i) => {
                    const { bg, labelColor } = getLabelStyle(entity.label);
                    return (
                        <button
                            key={`${entity.text}-${i}`}
                            type="button"
                            data-cursor="hover"
                            className="bauhaus-interactive"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                border: '2px solid var(--fg)',
                                borderRadius: 0,
                                boxShadow: 'var(--sh-sm)',
                                background: 'var(--white)',
                                cursor: 'pointer',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: 'var(--f)',
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    background: bg,
                                    color: labelColor,
                                }}
                            >
                                {entity.label.replace(/_/g, ' ')}
                            </span>
                            <span
                                style={{
                                    fontFamily: 'var(--f)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: 'var(--fg)',
                                }}
                            >
                                {entity.text}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function getLabelStyle(label: string): { bg: string; labelColor: string } {
    switch (label) {
        case 'TECHNICAL_SKILL':
            return { bg: 'var(--blue)', labelColor: '#FFFFFF' };
        case 'SOFT_SKILL':
            return { bg: 'var(--yellow)', labelColor: 'var(--fg)' };
        case 'FRAMEWORK':
            return { bg: 'var(--red)', labelColor: '#FFFFFF' };
        case 'COMPANY':
            return { bg: 'var(--fg)', labelColor: 'var(--yellow)' };
        case 'ROLE':
            return { bg: 'var(--muted)', labelColor: 'var(--fg)' };
        default:
            return { bg: 'var(--muted)', labelColor: 'var(--fg)' };
    }
}
