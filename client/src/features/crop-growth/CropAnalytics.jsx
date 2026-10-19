
import { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import "./crop-analytics.scss";

const CropAnalytics = ({ crop, observations = [] }) => {
    const sortedObservations = useMemo(() => {
        return [...observations].sort(
            (a, b) =>
                new Date(a.observedAt || a.createdAt) -
                new Date(b.observedAt || b.createdAt)
        );
    }, [observations]);

    const chartData = useMemo(
        () =>
            sortedObservations
                .filter((item) => item.plantHeightCm != null)
                .map((item) => ({
                    date: new Date(
                        item.observedAt || item.createdAt
                    ).toLocaleDateString(),
                    height: Number(item.plantHeightCm),
                })),
        [sortedObservations]
    );

    const firstHeight = chartData.length
        ? chartData[0].height
        : null;

    const latestHeight = chartData.length
        ? chartData[chartData.length - 1].height
        : null;

    const heightChange =
        firstHeight !== null && latestHeight !== null
            ? latestHeight - firstHeight
            : null;

    const cropName = crop?.cropName || "Selected crop";

    return (
        <section className="crop-analytics">
            <div className="analytics-intro">
                <div>
                    <span className="analytics-eyebrow">
                        GROWTH REPORT
                    </span>

                    <h2>{cropName}</h2>

                    <p>
                        Review the measurements recorded for this crop.
                    </p>
                </div>
            </div>

            <div className="analytics-stat-grid">
                <article className="analytics-stat-card">
                    <span>Total observations</span>
                    <strong>{observations.length}</strong>
                </article>

                <article className="analytics-stat-card">
                    <span>Latest plant height</span>
                    <strong>
                        {latestHeight !== null
                            ? `${latestHeight} cm`
                            : "No data"}
                    </strong>
                </article>

                <article className="analytics-stat-card">
                    <span>Height change</span>
                    <strong>
                        {heightChange !== null
                            ? `${
                                  heightChange > 0 ? "+" : ""
                              }${heightChange.toFixed(1)} cm`
                            : "No data"}
                    </strong>
                </article>
            </div>

            <section className="analytics-panel">
                <div className="analytics-panel-heading">
                    <h3>Plant height over time</h3>
                    <p>
                        Measurements are taken from your saved observations.
                    </p>
                </div>

                {chartData.length < 1 ? (
                    <div className="analytics-empty">
                        <h4>No height measurements yet</h4>
                        <p>
                            Add an observation and enter plant height
                            to display the growth chart.
                        </p>
                    </div>
                ) : (
                    <div className="analytics-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 12,
                                    right: 18,
                                    left: 0,
                                    bottom: 8,
                                }}
                            >
                                <CartesianGrid strokeDasharray="4 4" />

                                <XAxis dataKey="date" />

                                <YAxis
                                    domain={["auto", "auto"]}
                                    label={{
                                        value: "Height (cm)",
                                        angle: -90,
                                        position: "insideLeft",
                                    }}
                                />

                                <Tooltip
                                    formatter={(value) => [
                                        `${value} cm`,
                                        "Plant height",
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="height"
                                    name="Plant height"
                                    stroke="#27844c"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            <section className="analytics-panel">
                <div className="analytics-panel-heading">
                    <h3>Observation timeline</h3>
                    <p>
                        Recent records for this crop, from newest to oldest.
                    </p>
                </div>

                {sortedObservations.length === 0 ? (
                    <div className="analytics-empty">
                        No observations have been recorded.
                    </div>
                ) : (
                    <div className="analytics-timeline">
                        {[...sortedObservations]
                            .reverse()
                            .map((item) => (
                                <article
                                    className="analytics-timeline-item"
                                    key={item._id}
                                >
                                    <div className="analytics-timeline-marker" />

                                    <div className="analytics-timeline-content">
                                        <div className="analytics-timeline-top">
                                            <strong>
                                                {item.observedAt
                                                    ? new Date(
                                                          item.observedAt
                                                      ).toLocaleDateString()
                                                    : "Date not provided"}
                                            </strong>

                                            {item.plantHeightCm != null && (
                                                <span>
                                                    {item.plantHeightCm} cm
                                                </span>
                                            )}
                                        </div>

                                        {item.leafCondition && (
                                            <p>
                                                <b>Leaf condition:</b>{" "}
                                                {item.leafCondition}
                                            </p>
                                        )}

                                        {item.notes && <p>{item.notes}</p>}
                                    </div>
                                </article>
                            ))}
                    </div>
                )}
            </section>
        </section>
    );
};

export default CropAnalytics;
