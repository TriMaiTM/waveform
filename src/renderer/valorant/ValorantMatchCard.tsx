import React, { useState } from 'react'
import { ValorantMatch, ValorantMatchPlayer } from '../../shared/valorant-types'
import { IoTimeOutline, IoServerOutline } from 'react-icons/io5'

interface ValorantMatchCardProps {
  match: ValorantMatch;
}

// Complete Valorant official map splash dictionary
const MAP_SPLASHES: Record<string, string> = {
  'ascent': 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png',
  'split': 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png',
  'fracture': 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png',
  'bind': 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png',
  'breeze': 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png',
  'abyss': 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png',
  'lotus': 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png',
  'sunset': 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png',
  'pearl': 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png',
  'icebox': 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png',
  'haven': 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png',
  'drift': 'https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/splash.png',
  'district': 'https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/splash.png',
  'kasbah': 'https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/splash.png',
  'glitch': 'https://media.valorant-api.com/maps/d6336a5a-428f-c591-98db-c8a291159134/splash.png',
  'piazza': 'https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/splash.png',
  'corrode': 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/splash.png',
  'summit': 'https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/splash.png'
};

const DEFAULT_MAP_SPLASH = 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png';

function resolveMapSplash(mapName?: string): string {
  if (!mapName) return DEFAULT_MAP_SPLASH;
  const key = mapName.toLowerCase().trim();
  if (MAP_SPLASHES[key]) return MAP_SPLASHES[key];

  for (const [k, url] of Object.entries(MAP_SPLASHES)) {
    if (key.includes(k) || k.includes(key)) {
      return url;
    }
  }
  return DEFAULT_MAP_SPLASH;
}

export default function ValorantMatchCard({ match }: ValorantMatchCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false);

  const isWin = Boolean(match.has_won);
  const resultClass = isWin ? 'win' : 'loss';
  const kd = match.deaths > 0 ? (match.kills / match.deaths).toFixed(2) : match.kills;
  const mapSplash = resolveMapSplash(match.map);
  const adr = match.rounds_played > 0 ? Math.round(match.damage_made / match.rounds_played) : 0;

  const durationMin = match.game_length_seconds ? Math.floor(match.game_length_seconds / 60) : 0;
  const durationSec = match.game_length_seconds ? match.game_length_seconds % 60 : 0;

  const bluePlayers = match.teams?.blue?.players || [];
  const redPlayers = match.teams?.red?.players || [];

  const renderScoreboardTable = (
    teamTitle: string,
    teamTheme: 'blue' | 'red',
    isTeamWin: boolean,
    roundsWon: number,
    players: ValorantMatchPlayer[]
  ) => {
    return (
      <div className={`val-scoreboard-team-block ${teamTheme}`}>
        {/* Team Header Banner */}
        <div className="val-scoreboard-team-header">
          <div className="val-team-header-left">
            <span className={`val-team-title ${teamTheme}`}>{teamTitle}</span>
            <span className={`val-team-outcome-text ${isTeamWin ? 'win' : 'loss'}`}>
              - {isTeamWin ? 'WIN' : 'LOSS'}
            </span>
          </div>
          <div className="val-team-header-right">
            <span className="val-team-rounds-count">{roundsWon} HIỆP THẮNG</span>
          </div>
        </div>

        {/* 5v5 Players Table */}
        <div className="val-scoreboard-table-wrap">
          <table className="val-scoreboard-table">
            <thead>
              <tr>
                <th className="th-player">NGƯỜI CHƠI</th>
                <th className="th-rank">RANK</th>
                <th className="th-acs">ACS</th>
                <th className="th-kda">K / D / A</th>
                <th className="th-diff">+/-</th>
                <th className="th-kd">K/D</th>
                <th className="th-adr">ADR</th>
                <th className="th-hs">HS%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => {
                const isMe = Boolean(p.is_current_player);
                return (
                  <tr key={`${p.puuid}-${idx}`} className={`val-scoreboard-row ${isMe ? 'highlight-me' : ''}`}>
                    {/* Player Info (Agent + Name + Clean text indicators) */}
                    <td className="td-player">
                      <div className="val-score-player-wrap">
                        <div className="val-score-agent-icon-wrap">
                          {p.agent_icon ? (
                            <img src={p.agent_icon} alt={p.character} className="val-score-agent-img" />
                          ) : (
                            <div className="val-score-agent-placeholder" />
                          )}
                        </div>
                        <div className="val-score-player-names">
                          <div className="val-score-name-row">
                            <span className={`val-score-player-name ${isMe ? 'is-me' : ''}`}>{p.name}</span>
                            <span className="val-score-player-tag">#{p.tag}</span>
                            {isMe && <span className="val-you-text">• BẠN</span>}
                          </div>
                          <div className="val-score-char-row">
                            <span className="val-score-char-name">{p.character}</span>
                            {p.is_match_mvp && (
                              <span className="val-mvp-text match" title="Match MVP - Điểm ACS cao nhất cả trận">
                                ★ MATCH MVP
                              </span>
                            )}
                            {p.is_team_mvp && (
                              <span className="val-mvp-text team" title="Team MVP - Điểm ACS cao nhất đội">
                                ★ TEAM MVP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rank */}
                    <td className="td-rank">
                      <div className="val-score-rank-box" title={p.rank_name}>
                        {p.rank_icon && (
                          <img src={p.rank_icon} alt={p.rank_name} className="val-score-rank-icon" />
                        )}
                        <span className="val-score-rank-name">{p.rank_name}</span>
                      </div>
                    </td>

                    {/* ACS */}
                    <td className="td-acs">
                      <span className="val-score-acs-val">{p.acs}</span>
                    </td>

                    {/* KDA */}
                    <td className="td-kda">
                      <span className="val-score-kda-val">
                        <strong style={{ color: '#ffffff' }}>{p.stats.kills}</strong> / <strong style={{ color: '#ef4444' }}>{p.stats.deaths}</strong> / <span style={{ color: '#9ca3af' }}>{p.stats.assists}</span>
                      </span>
                    </td>

                    {/* Differential */}
                    <td className="td-diff">
                      <span className={`val-score-diff-val ${p.diff > 0 ? 'pos' : p.diff < 0 ? 'neg' : 'zero'}`}>
                        {p.diff > 0 ? `+${p.diff}` : p.diff}
                      </span>
                    </td>

                    {/* K/D */}
                    <td className="td-kd">
                      <span className="val-score-kd-val" style={{ color: p.kd >= 1.0 ? '#1ed760' : '#ff4655' }}>
                        {p.kd.toFixed(2)}
                      </span>
                    </td>

                    {/* ADR */}
                    <td className="td-adr">
                      <span className="val-score-adr-val">{p.adr}</span>
                    </td>

                    {/* HS% */}
                    <td className="td-hs">
                      <span className="val-score-hs-val" style={{ color: '#fbbf24' }}>{p.hs_pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`val-match-card ${resultClass} ${expanded ? 'expanded' : ''}`}>
      {/* Top Header Row - Contains Map Splash and Summary Data */}
      <div 
        className="val-match-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Map Background ONLY inside Header Row */}
        <div 
          className="val-match-map-bg"
          style={{ backgroundImage: `url(${mapSplash})` }}
        />
        <div className="val-match-bg-overlay" />

        {/* Header Content Row */}
        <div className="val-match-card-content">
          {/* TFT-style Large Radiant Outcome Text */}
          <div className={`val-match-big-outcome ${resultClass}`}>
            {isWin ? 'WIN' : 'LOSS'}
          </div>

          {/* Map & Mode & Date */}
          <div className="val-match-meta">
            <span className="val-match-map">{match.map}</span>
            <div className="val-match-mode-sub">
              <span className="val-match-mode-name">{match.mode || 'Competitive'}</span>
              <span className="val-match-dot">•</span>
              <span className="val-match-time">{match.game_start ? match.game_start.split(' ')[0] : 'Recent'}</span>
            </div>
          </div>

          {/* Agent Portrait & Name */}
          <div className="val-agent-col">
            {match.agent.icon ? (
              <img src={match.agent.icon} alt={match.agent.name} className="val-agent-avatar" />
            ) : (
              <div className="val-agent-avatar" />
            )}
            <div className="val-agent-meta-col">
              <span className="val-agent-name">{match.agent.name}</span>
              {match.is_match_mvp ? (
                <span className="val-mvp-text match">★ MATCH MVP</span>
              ) : match.is_team_mvp ? (
                <span className="val-mvp-text team">★ TEAM MVP</span>
              ) : null}
            </div>
          </div>

          {/* Round Score */}
          <div className="val-score-col">
            <span className="val-score-text">{match.team_score} : {match.enemy_score}</span>
            <span className="val-score-label">{match.rounds_played} Rounds</span>
          </div>

          {/* Player Match Stats */}
          <div className="val-stats-col">
            <div className="val-stat-mini">
              <span className="val-stat-mini-val">{match.kills} / {match.deaths} / {match.assists}</span>
              <span className="val-stat-mini-lbl">KDA ({kd})</span>
            </div>

            <div className="val-stat-mini">
              <span className="val-stat-mini-val">{match.score}</span>
              <span className="val-stat-mini-lbl">Avg ACS</span>
            </div>

            <div className="val-stat-mini">
              <span className="val-stat-mini-val" style={{ color: '#fbbf24' }}>{match.headshot_pct}%</span>
              <span className="val-stat-mini-lbl">HS%</span>
            </div>

            {adr > 0 && (
              <div className="val-stat-mini">
                <span className="val-stat-mini-val" style={{ color: '#f43f5e' }}>{adr}</span>
                <span className="val-stat-mini-lbl">ADR</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable 5v5 Scoreboard Panel (Solid Background, Crisp High Contrast) */}
      {expanded && (
        <div className="val-match-scoreboard-panel" onClick={(e) => e.stopPropagation()}>
          {/* Match Info Strip */}
          <div className="val-scoreboard-info-strip">
            <div className="val-info-strip-item">
              <IoTimeOutline size={14} color="#00f0ff" />
              <span>Thời lượng: {durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${match.rounds_played} hiệp`}</span>
            </div>
            {match.server && (
              <div className="val-info-strip-item">
                <IoServerOutline size={14} color="#00f0ff" />
                <span>Máy chủ: {match.server}</span>
              </div>
            )}
            <div className="val-info-strip-item">
              <span>{match.rounds_played} hiệp đấu</span>
            </div>
          </div>

          {/* Team Blue Scoreboard */}
          {bluePlayers.length > 0 && renderScoreboardTable(
            'BLUE TEAM',
            'blue',
            Boolean(match.teams?.blue?.has_won),
            match.teams?.blue?.rounds_won || 0,
            bluePlayers
          )}

          {/* Team Red Scoreboard */}
          {redPlayers.length > 0 && renderScoreboardTable(
            'RED TEAM',
            'red',
            Boolean(match.teams?.red?.has_won),
            match.teams?.red?.rounds_won || 0,
            redPlayers
          )}

          {bluePlayers.length === 0 && redPlayers.length === 0 && (
            <div className="val-scoreboard-empty">
              Dữ liệu chi tiết 10 người chơi của trận này không khả dụng từ Riot Games.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
