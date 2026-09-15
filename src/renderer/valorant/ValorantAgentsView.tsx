import React, { useState, useEffect } from 'react'
import { ValorantAgent, AgentAbility } from '../../shared/valorant-wiki-types'
import { IoClose } from 'react-icons/io5'

// Official Role Icons Mapping
const ROLE_FILTERS = [
  { id: 'all', label: 'TẤT CẢ', icon: null },
  { 
    id: 'dbe8757e-9e92-4ed4-b39f-9dfc589691d4', 
    name: 'Duelist', 
    label: 'DUELIST', 
    icon: 'https://media.valorant-api.com/agents/roles/dbe8757e-9e92-4ed4-b39f-9dfc589691d4/displayicon.png' 
  },
  { 
    id: '1b47567f-8f7b-444b-aae3-b0c634622d10', 
    name: 'Initiator', 
    label: 'INITIATOR', 
    icon: 'https://media.valorant-api.com/agents/roles/1b47567f-8f7b-444b-aae3-b0c634622d10/displayicon.png' 
  },
  { 
    id: '4ee40330-ecdd-4f2f-98a8-eb1243428373', 
    name: 'Controller', 
    label: 'CONTROLLER', 
    icon: 'https://media.valorant-api.com/agents/roles/4ee40330-ecdd-4f2f-98a8-eb1243428373/displayicon.png' 
  },
  { 
    id: '5fc02f99-4091-4486-a531-98459a3e95e9', 
    name: 'Sentinel', 
    label: 'SENTINEL', 
    icon: 'https://media.valorant-api.com/agents/roles/5fc02f99-4091-4486-a531-98459a3e95e9/displayicon.png' 
  }
];

// Ability order: strictly C -> Q -> E -> X
const ABILITY_SLOT_ORDER: Record<string, { rank: number; key: string }> = {
  'Grenade': { rank: 1, key: 'CHIÊU C' },
  'Ability1': { rank: 2, key: 'CHIÊU Q' },
  'Ability2': { rank: 3, key: 'CHIÊU E' },
  'Ultimate': { rank: 4, key: 'CHIÊU X (ULT)' },
  'Passive': { rank: 5, key: 'NỘI TẠI' }
};

export default function ValorantAgentsView() {
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all');
  const [activeAgent, setActiveAgent] = useState<ValorantAgent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Fetch official Vietnamese descriptions & abilities
      const res = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=vi-VN');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        // Sort agents alphabetically
        const sorted = (json.data as ValorantAgent[]).sort((a, b) => 
          a.displayName.localeCompare(b.displayName)
        );
        setAgents(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch Valorant agents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter agents by role ID
  const filteredAgents = agents.filter((a) => {
    if (selectedRoleId === 'all') return true;
    return a.role?.uuid === selectedRoleId;
  });

  // Sort abilities strictly C -> Q -> E -> X
  const getSortedAbilities = (abilities: AgentAbility[]) => {
    if (!abilities) return [];
    return [...abilities].sort((a, b) => {
      const orderA = ABILITY_SLOT_ORDER[a.slot]?.rank || 99;
      const orderB = ABILITY_SLOT_ORDER[b.slot]?.rank || 99;
      return orderA - orderB;
    });
  };

  return (
    <div className="val-wiki-container val-agents-theme">
      {/* Background Grid & Ambient Glow */}
      <div className="val-agents-bg" />

      {/* Top Bar / Header */}
      <div className="val-wiki-header">
        <div className="val-wiki-header-title">
          <div className="val-blueprint-tag" style={{ color: '#ff4655', borderColor: 'rgba(255, 70, 85, 0.4)' }}>
            VALORANT PROTOCOL // ROSTER
          </div>
          <h2>AGENTS</h2>
        </div>

        {/* Role Filter: Icon Buttons */}
        <div className="val-role-icon-filters">
          {ROLE_FILTERS.map((rf) => (
            <button
              key={rf.id}
              type="button"
              className={`val-role-filter-btn ${selectedRoleId === rf.id ? 'active' : ''}`}
              onClick={() => setSelectedRoleId(rf.id)}
              title={rf.label}
            >
              {rf.icon ? (
                <img src={rf.icon} alt={rf.label} className="val-role-filter-icon" />
              ) : (
                <span className="val-role-filter-all-text">ALL</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Roster Grid */}
      <div className="val-agents-scroll-area">
        {loading ? (
          <div className="val-wiki-loading">
            <div className="spinner" style={{ borderColor: 'rgba(255, 70, 85, 0.2)', borderTopColor: '#ff4655' }}></div>
            <span>Đang tải danh sách Đặc vụ từ máy chủ Riot Games...</span>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="val-wiki-empty">
            <span>Không tìm thấy đặc vụ nào trong vai trò này.</span>
          </div>
        ) : (
          <div className="val-agents-card-grid">
            {filteredAgents.map((agent) => (
              <div
                key={agent.uuid}
                className="val-agent-tactical-card"
                onClick={() => setActiveAgent(agent)}
              >
                {/* Tactical Corner Cuts */}
                <div className="val-tactical-corner-tr" />
                <div className="val-tactical-corner-bl" />

                {/* Avatar Portrait */}
                <div className="val-agent-tactical-avatar">
                  <img
                    src={agent.displayIcon}
                    alt={agent.displayName}
                    className="val-agent-tactical-img"
                  />
                  {agent.role?.displayIcon && (
                    <img
                      src={agent.role.displayIcon}
                      alt={agent.role.displayName}
                      className="val-agent-role-icon-badge"
                      title={agent.role.displayName}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="val-agent-tactical-info">
                  <div className="val-agent-tactical-name">{agent.displayName}</div>
                  <div className="val-agent-tactical-role">{agent.role?.displayName?.toUpperCase() || 'AGENT'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent Detail Inspection Modal */}
      {activeAgent && (
        <div className="val-agent-modal-backdrop" onClick={() => setActiveAgent(null)}>
          <div 
            className="val-agent-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button" 
              className="val-agent-modal-close"
              onClick={() => setActiveAgent(null)}
              title="Đóng hồ sơ"
            >
              <IoClose size={24} />
            </button>

            {/* Modal Content: Full-Bleed Artwork + Details */}
            <div className="val-agent-modal-content">
              {/* Left Column: Full Hero Portrait Art */}
              <div className="val-agent-hero-art-wrap">
                {activeAgent.background && (
                  <img
                    src={activeAgent.background}
                    alt=""
                    className="val-agent-art-backdrop"
                  />
                )}
                {activeAgent.fullPortrait || activeAgent.fullPortraitV2 ? (
                  <img
                    src={activeAgent.fullPortraitV2 || activeAgent.fullPortrait}
                    alt={activeAgent.displayName}
                    className="val-agent-hero-full-art"
                  />
                ) : (
                  <img
                    src={activeAgent.displayIcon}
                    alt={activeAgent.displayName}
                    className="val-agent-hero-full-art"
                  />
                )}
              </div>

              {/* Right Column: Bio, Role & Abilities (Scrollable to the bottom) */}
              <div className="val-agent-details-column">
                {/* Agent Header - FIXED: No leading '0' */}
                <div className="val-agent-modal-head-info">
                  <div className="val-agent-protocol-tag">
                    AGENT PROTOCOL // {activeAgent.displayName.toUpperCase()}
                  </div>
                  <h1 className="val-agent-modal-name">{activeAgent.displayName}</h1>

                  {activeAgent.role && (
                    <div className="val-agent-modal-role-row">
                      {activeAgent.role.displayIcon && (
                        <img
                          src={activeAgent.role.displayIcon}
                          alt={activeAgent.role.displayName}
                          className="val-agent-role-lg-icon"
                        />
                      )}
                      <div>
                        <div className="val-agent-role-title">{activeAgent.role.displayName.toUpperCase()}</div>
                        <div className="val-agent-role-desc">{activeAgent.role.description}</div>
                      </div>
                    </div>
                  )}

                  {/* Biography in Vietnamese */}
                  <p className="val-agent-bio">{activeAgent.description}</p>
                </div>

                {/* Abilities Roster Section - Sorted C -> Q -> E -> X */}
                <div className="val-abilities-section">
                  <div className="val-abilities-section-title">
                    <span>BẢNG KỸ NĂNG CHI TIẾT</span>
                  </div>

                  <div className="val-abilities-list">
                    {getSortedAbilities(activeAgent.abilities).map((ability, idx) => {
                      const slotMeta = ABILITY_SLOT_ORDER[ability.slot] || { key: ability.slot };
                      return (
                        <div key={`${ability.slot}-${idx}`} className="val-ability-card">
                          <div className="val-ability-header">
                            <div className="val-ability-icon-wrap">
                              {ability.displayIcon ? (
                                <img
                                  src={ability.displayIcon}
                                  alt={ability.displayName}
                                  className="val-ability-icon"
                                />
                              ) : (
                                <div className="val-ability-icon-fallback" />
                              )}
                            </div>
                            <div>
                              <div className="val-ability-slot-key">{slotMeta.key}</div>
                              <div className="val-ability-name">{ability.displayName}</div>
                            </div>
                          </div>
                          <div className="val-ability-desc">{ability.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
