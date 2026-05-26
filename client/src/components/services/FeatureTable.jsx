import React, { useState } from "react";
import Section from "../layout/Section";
import Container from "../layout/Container";
import { Icon } from "@iconify/react";
import SectionHeader from "../common/SectionHeader";
import { plans, featureSections } from "../../data/ServicesData";

const FeatureTable = () => {
  const [billing, setBilling] = useState("yearly");

  return (
    <Section className="bg-white">
      <Container>
        <div className="w-full">
          <SectionHeader
            title="Feature Table"
            label="compare plans"
            className="mb-2"
          />
          <p className="text-gray-600 mb-6">
            Choose the perfect plan for your business needs
          </p>

          {/* Plan Cards Row */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {plans.map((plan, idx) => (
              <div
                key={plan.name}
                className={`rounded-2xl border bg-white p-6 flex flex-col items-center ${
                  plan.popular
                    ? "border-2 border-brand-primary"
                    : "border-gray-200"
                }`}
              >
                <div className="font-bold text-lg mb-1 text-gray-900">
                  {plan.name}
                </div>
                <div className="flex items-end mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-500 ml-1 text-base">
                    {plan.period}
                  </span>
                </div>
                <button
                  className={`w-full py-2 rounded-full font-medium mt-2 transition-colors ${
                    plan.popular
                      ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.button}
                </button>
              </div>
            ))}
          </div> */}
          {/* Feature Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    {" "}
                  </th>
                  {plans.map((plan, idx) => (
                    <th
                      key={plan.name}
                      className="bg-white px-6 py-4 text-center text-lg font-medium text-gray-900"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureSections.map((section, sIdx) => (
                  <React.Fragment key={section.title}>
                    <tr>
                      <td
                        colSpan={4}
                        className="bg-gray-100 px-6 py-3 text-left text-base font-bold text-gray-900 border-t border-b border-gray-200"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.features.map((feature, fIdx) => (
                      <tr key={feature.name}>
                        <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                          {feature.name}
                          {feature.info && (
                            <Icon
                              icon="solar:info-circle-bold"
                              className="text-gray-300"
                              width={16}
                            />
                          )}
                        </td>
                        {feature.values.map((val, vIdx) => (
                          <td
                            key={vIdx}
                            className="px-6 py-4 text-center text-base align-middle"
                          >
                            {val === "tick" ? (
                              <span className="flex justify-center items-center h-full">
                                <Icon
                                  icon="solar:check-circle-bold"
                                  className="text-brand-primary text-xl"
                                />
                              </span>
                            ) : typeof val === "string" && val === "-" ? (
                              <span className="text-gray-300 text-xl">–</span>
                            ) : (
                              <span className="flex justify-center items-center h-full">
                                {val}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default FeatureTable;
