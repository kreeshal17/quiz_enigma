"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firebasedb } from "../firebase/firebase.config";

interface TeamMember {
  name: string;
  email: string;
}

interface Team {
  teamId: string;
  teamName: string;
  teamMembers: TeamMember[];
  marksScore: number | null;
  totalScore: number | null;
  isCompleted: boolean;
  isStarted: boolean;
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    setRevealed(false);
    try {
      const snap = await getDocs(collection(firebasedb, "teams"));
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        return {
          teamId: d.id,
          teamName: raw.teamName ?? "Unknown",
          teamMembers: raw.teamMembers ?? [],
          marksScore: raw.marksScore ?? 0,
          totalScore: raw.totalScore ?? 0,
          isCompleted: raw.isCompleted ?? false,
          isStarted: raw.isStarted ?? false,
        };
      });
      data.sort((a, b) => (b.marksScore ?? 0) - (a.marksScore ?? 0));
      setTeams(data);
      setTimeout(() => setRevealed(true), 100);
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const memberNames = (team: Team) =>
    team.teamMembers.map((m) => m.name).join(", ") || "No members";

  const top3 = teams.slice(0, 3);
  const rest = teams.slice(3);

  const podiumOrder =
    top3.length === 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  return (
    <div
      style={{
        backgroundColor: "#030a06",
        minHeight: "100vh",
        color: "#ffffff",
        padding: "80px 40px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Glow top */}
      <div
        style={{
          position: "absolute",
          borderRadius: "50%",
          pointerEvents: "none",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(0,255,102,0.12) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      {/* Glow bottom */}
      <div
        style={{
          position: "absolute",
          borderRadius: "50%",
          pointerEvents: "none",
          bottom: "-300px",
          left: "-100px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(0,255,102,0.08) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Header */}
      <div
        style={{ position: "relative", zIndex: 10, width: "100%", textAlign: "center" }}
        className={`transition-all duration-700 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <h1
          style={{
            fontSize: "48px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginBottom: "8px",
            background: "linear-gradient(to right, #ffffff, #00ff66)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
          }}
        >
          Global Leaderboard
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#8a9e91",
            fontWeight: 500,
            textAlign: "center",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "64px",
          }}
        >
          Enigma Quiz Championship
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-5">
          <div className="w-12 h-12 border-2 border-neutral-800 border-t-green-400 rounded-full animate-spin" />
          <p style={{ fontSize: "12px", color: "#4e6b5a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Loading scores…
          </p>
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "160px 0" }}>
          <p style={{ color: "#4e6b5a", fontWeight: 700 }}>No teams yet.</p>
        </div>
      ) : (
        <>
          {/* ── Podium ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: "24px",
              marginBottom: "80px",
              width: "100%",
              maxWidth: "1000px",
              position: "relative",
              zIndex: 10,
            }}
          >
            {podiumOrder.map((team) => {
              const actualRank = top3.indexOf(team);
              const isFirst = actualRank === 0;
              const isSecond = actualRank === 1;
              const isThird = actualRank === 2;
              const animDelay = isFirst ? 0 : isSecond ? 120 : 240;

              const cardHeight = isFirst ? "380px" : isSecond ? "320px" : "300px";
              const cardTransform = isFirst ? "translateY(-24px)" : "none";

              const cardBorder = isFirst
                ? "1px solid rgba(0,255,102,0.4)"
                : isSecond
                ? "1px solid #1a261e"
                : "1px solid #1a261e";

              const cardBoxShadow = isFirst
                ? "inset 0 2px 0 0 #00ff66, 0 16px 40px -8px rgba(0,255,102,0.15)"
                : isSecond
                ? "inset 0 2px 0 0 #e2e8f0"
                : "inset 0 2px 0 0 #cd7f32";

              const cardBg = isFirst
                ? "linear-gradient(180deg, rgba(0,255,102,0.05) 0%, #0a120d 100%)"
                : "#0a120d";

              const badgeBg = isFirst
                ? "linear-gradient(135deg, #00ff66 0%, #00cc52 100%)"
                : isSecond
                ? "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)"
                : "linear-gradient(135deg, #cd7f32 0%, #a05d1e 100%)";

              const badgeSize = isFirst ? "56px" : "48px";
              const badgeTop = isFirst ? "-28px" : "-20px";
              const badgeShadow = isFirst
                ? "0 4px 12px rgba(0,255,102,0.4)"
                : isSecond
                ? "0 4px 12px rgba(226,232,240,0.2)"
                : "0 4px 12px rgba(205,127,50,0.2)";

              const nameColor = isFirst ? "#00ff66" : "#ffffff";
              const nameFontSize = isFirst ? "28px" : "24px";
              const scoreFontSize = isFirst ? "48px" : "36px";
              const scoreMarginTop = isFirst ? "32px" : "24px";
              const memberColor = isFirst ? "#b3c9bc" : "#8a9e91";

              return (
                <div
                  key={team.teamId}
                  className={`transition-all duration-700 ${
                    revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    transitionDelay: `${animDelay}ms`,
                    zIndex: isFirst ? 10 : 0,
                  }}
                >
                  {/* Rank badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: badgeTop,
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: isFirst ? "24px" : "20px",
                      color: "#000",
                      zIndex: 2,
                      background: badgeBg,
                      boxShadow: badgeShadow,
                    }}
                  >
                    {isFirst ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                        <path d="M5 20h14" />
                      </svg>
                    ) : (
                      actualRank + 1
                    )}
                  </div>

                  {/* Card */}
                  <div
                    style={{
                      background: cardBg,
                      border: cardBorder,
                      borderRadius: "16px",
                      padding: "32px 24px",
                      textAlign: "center",
                      width: "280px",
                      height: cardHeight,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      position: "relative",
                      boxShadow: cardBoxShadow,
                      transform: cardTransform,
                      paddingTop: "40px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: nameFontSize,
                        fontWeight: 700,
                        color: nameColor,
                        marginBottom: "4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                    >
                      {team.teamName}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: memberColor,
                        lineHeight: 1.4,
                        marginBottom: "auto",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {memberNames(team)}
                    </p>

                    <div style={{ marginTop: scoreMarginTop }}>
                      <p
                        style={{
                          fontSize: scoreFontSize,
                          fontWeight: 800,
                          color: "#00ff66",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}
                      >
                        {(team.marksScore ?? 0).toLocaleString()}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#8a9e91",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginTop: "4px",
                        }}
                      >
                        Points
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── List rows ── */}
          {rest.length > 0 && (
            <div
              style={{
                width: "100%",
                maxWidth: "900px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
                zIndex: 10,
              }}
            >
              {rest.map((team, idx) => {
                const rank = idx + 4;
                const delay = 400 + idx * 80;

                return (
                  <div
                    key={team.teamId}
                    className={`transition-all duration-700 ${
                      revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                    style={{ transitionDelay: `${delay}ms` }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "20px 24px",
                        background: "#0a120d",
                        border: "1px solid #1a261e",
                        borderRadius: "12px",
                        cursor: "default",
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "rgba(0,255,102,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor =
                          "#1a261e";
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          fontSize: "20px",
                          fontWeight: 800,
                          color: "#4e6b5a",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        #{rank}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          paddingRight: "24px",
                          overflow: "hidden",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#ffffff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {team.teamName}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#8a9e91",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {memberNames(team)}
                        </p>
                      </div>

                      <div style={{ textAlign: "right", minWidth: "120px" }}>
                        <p
                          style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            color: "#00ff66",
                          }}
                        >
                          {(team.marksScore ?? 0).toLocaleString()}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#8a9e91",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Pts
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Refresh */}
      {!loading && teams.length > 0 && (
        <div
          className={`transition-all duration-700 delay-[800ms] ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
          style={{ marginTop: "56px", textAlign: "center" }}
        >
          <button
            onClick={fetchTeams}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#4e6b5a",
              background: "#0a120d",
              border: "1px solid #1a261e",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = "rgba(0,255,102,0.3)";
              b.style.color = "#8a9e91";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget;
              b.style.borderColor = "#1a261e";
              b.style.color = "#4e6b5a";
            }}
          >
            <span style={{ fontWeight: 900 }}>↻</span> Refresh
          </button>
        </div>
      )}
    </div>
  );
}