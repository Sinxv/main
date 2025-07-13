import { data } from './EHD.js';
    
const characterData = data.characterData;
const skillDatabase = data.skills;

document.addEventListener("DOMContentLoaded", function () {

    var cichp = document.getElementById("cichp");
    var pichp = document.getElementById("pichp");
    var chinchp = document.getElementById("chinchp");
    var lastSelectedChar = null;
    var lastCharIndex = 0; // Track last clicked character index

    // Hide elements initially
    pichp.style.display = "none";
    chinchp.style.display = "none";

    // Click event for character icons
    document.querySelectorAll("#cichp li").forEach((charItem, charIndex) => {
        charItem.addEventListener("click", function () {
            // Remove 'selected' class from previously selected character
            if (lastSelectedChar) {
                lastSelectedChar.classList.remove("selected");
            }
            this.classList.add("selected");
            lastSelectedChar = this;

            // Determine animation direction
            var isLeft = charIndex < lastCharIndex;
            pichp.classList.add(isLeft ? "slide-left-out" : "slide-right-out");

            setTimeout(() => {
                // Swap icons when out of view
                updatePathIcons(charIndex);

                // Reverse animation to bring them back in
                pichp.classList.remove("slide-left-out", "slide-right-out");
                pichp.classList.add(isLeft ? "slide-left-in" : "slide-right-in");

                setTimeout(() => {
                    pichp.classList.remove("slide-left-in", "slide-right-in");
                }, 300);
            }, 250);

            // Show path selection, hide character info
            pichp.style.display = "block";
            chinchp.style.display = "none";
            lastCharIndex = charIndex;
        });
    });

    // Click event for path icons
    document.querySelectorAll("#pichp li").forEach((pathItem) => {
        pathItem.addEventListener("click", function () {
            var pathId = this.dataset.pathId;
            chinchp.style.display = "block"; // Show character info
            updateCharacterInfo(pathId);
        });
    });

    function updatePathIcons(charIndex) {
        var pathImages = {
            0: ["images/Elsword/icon_KE.png", "images/Elsword/icon_RM.png", "images/Elsword/icon_IM.png", "images/Elsword/icon_GS.png"],
            1: ["images/Aisha/icon_AeS.png", "images/Aisha/icon_Oz.png", "images/Aisha/icon_MtM.png", "images/Aisha/icon_LA.png"],
            2: ["images/Rena/icon_AN.png", "images/Rena/icon_DyB.png", "images/Rena/icon_TW.png", "images/Rena/icon_PR.png"],
            3: ["images/Raven/icon_FB.png", "images/Raven/icon_RH.png", "images/Raven/icon_NI.png", "images/Raven/icon_RV.png"],
            4: ["images/Eve/icon_CU.png", "images/Eve/icon_CE.png", "images/Eve/icon_CS.png", "images/Eve/icon_CA.png"],
            5: ["images/Chung/icon_CC.png", "images/Chung/icon_FP.png", "images/Chung/icon_Cent.png", "images/Chung/icon_DA.png"],
            6: ["images/Ara/icon_Aps.png", "images/Ara/icon_Devi.png", "images/Ara/icon_Shakti.png", "images/Ara/icon_SU.png"],
            7: ["images/Elesis/icon_ES.png", "images/Elesis/icon_FL.png", "images/Elesis/icon_BQ.png", "images/Elesis/icon_AD.png"],
            8: ["images/Add/icon_DB.png", "images/Add/icon_Dom.png", "images/Add/icon_MPx.png", "images/Add/icon_OV.png"],
            9: ["images/LuCiel/icon_CaT.png", "images/LuCiel/icon_Inn.png", "images/LuCiel/icon_Dia.png", "images/LuCiel/icon_Dem.png"],
            10: ["images/Rose/icon_TB.png", "images/Rose/icon_BlM.png", "images/Rose/icon_MN.png", "images/Rose/icon_PO.png"],
            11: ["images/Ain/icon_RT.png", "images/Ain/icon_BL.png", "images/Ain/icon_HR.png", "images/Ain/icon_OP.png"],
            12: ["images/Laby/icon_EtW.png", "images/Laby/icon_RaS.png", "images/Laby/icon_NL.png", "images/Laby/icon_TP.png"],
            13: ["images/Noah/icon_LB.png", "images/Noah/icon_CL.png", "images/Noah/icon_NP.png", "images/Noah/icon_MO.png"],
            14: ["images/Lithia/icon_GB.png", "images/Lithia/icon_AV.png", "images/Lithia/icon_AC.png", "images/Lithia/icon_MC.png"],
            // Add all character paths here
        };

        var selectedPaths = pathImages[charIndex] || ["", "", "", ""];

        document.querySelectorAll("#pichp li").forEach((pathItem, pathIndex) => {
            pathItem.innerHTML = `<img src="${selectedPaths[pathIndex]}" alt="Path">`;
            pathItem.dataset.pathId = charIndex * 4 + pathIndex;
        });
    }
    
    function updateCharacterInfo(pathId) {

        var data = characterData[pathId] || {};

    // Update character info display
    document.getElementById("ICON").innerHTML = `<img src="${data.ICON || ""}" alt="Icon">`;
    document.getElementById("CNAME").textContent = data.CNAME || "Unknown";
    document.getElementById("htuchp").querySelector("#htutitle").textContent = "How to use " + (data.PNAME || "Unknown");
    document.getElementById("PNAME").textContent = data.PNAME || "Unknown";
    document.getElementById("ROLE").textContent = data.ROLE || "Unknown";
    document.getElementById("DTYPE").textContent = data.DTYPE || "Unknown";

    // Update Skill Sets
    const setsContainer = document.querySelector(".Sets");
    setsContainer.innerHTML = "";
    
    if (data.Skills && data.Skills.length) {
        data.Skills.forEach((set, index) => {
            const setButton = document.createElement("div");
            setButton.className = "SET" + (index + 1);
            setButton.textContent = set.name;
            setButton.addEventListener("click", () => showSkillSet(set));
            setsContainer.appendChild(setButton);
        });
        
        // Show first set by default
        if (data.Skills[0]) {
            showSkillSet(data.Skills[0]);
        }
    } else {
        // Handle case where no skills are defined
        console.warn("No skills defined for character:", data.CNAME);
    }

    // Update Buffs
    if (typeof updateBuffList === 'function') {
        updateBuffList("blchpheal", data.blchpheal || []);
        updateBuffList("blchpbuff", data.blchpbuff || []);
        updateBuffList("blchpdebuff", data.blchpdebuff || []);
    }

    // Update Additional Notes & Guide
    document.getElementById("AddN").textContent = data.AddN || "No additional notes.";
    const dchpContainer = document.getElementById("dchp").querySelector("#text");
    dchpContainer.innerHTML = "";

    if (Array.isArray(data.dchp)) {
        data.dchp.forEach(part => {
            const p = document.createElement("p");
            p.textContent = part;
            dchpContainer.appendChild(p);
        });
    } else {
        dchpContainer.textContent = data.dchp || "No description available.";
    }
    document.getElementById("htuchp").querySelector("#text").textContent = data.htuchp || "No guide available.";
}

// Updated showSkillSet function
function showSkillSet(skillSet) {
    if (!skillSet || !Array.isArray(skillSet.skills)) {
        console.error("Invalid skill set data:", skillSet);
        return;
    }

    const skillElements = document.querySelectorAll(".Row1 div, .Row2 div");
    
    // Clear all skill slots first
    skillElements.forEach(slot => {
        slot.innerHTML = "";
        slot.onclick = null;
        slot.style.position = "relative";
        slot.title = "";
    });
    
    // Fill with new skills
    skillSet.skills.forEach((skillRef, index) => {
        if (index < skillElements.length) {
            const skill = skillDatabase[skillRef.id];
            if (!skill) {
                console.warn("Skill not found:", skillRef.id);
                return;
            }
            
            const slot = skillElements[index];
            const version = skillRef.isMod ? "mod" : "base";
            
            // Create skill icon
            const skillIcon = document.createElement("img");
            skillIcon.src = skill.icon;
            skillIcon.alt = skill.name;
            skillIcon.style.width = "100%";
            skillIcon.style.height = "100%";
            
            // Add mod indicator if needed
            if (skillRef.isMod && skill.mod) {
                const modIcon = document.createElement("img");
                modIcon.src = "images/Mod.png";
                modIcon.className = "mod-icon";
                slot.appendChild(modIcon);
            }
            
            slot.appendChild(skillIcon);
            slot.title = `${skill.name}${skillRef.isMod ? " [Mod]" : ""}`;
            
            slot.onclick = (e) => {
                e.stopPropagation();
                showSkillPopup(skill, skillRef.isMod, slot);
            };
        }
    });
}

// Enhanced skill popup
function showSkillPopup(skill, isMod, parentElement) {
    const existingPopup = document.querySelector(".skill-popup");
    if (existingPopup) existingPopup.remove();
    
    const popup = document.createElement("div");
    popup.className = "skill-popup";
    
    const rect = parentElement.getBoundingClientRect();
    popup.style.position = "absolute";
    popup.style.left = `${rect.left}px`;
    popup.style.bottom = `${window.innerHeight - rect.top + 5}px`;
    
    // Tier color
    let tierColor;
    switch(skill.tier) {
        case "Active": tierColor = "#FFFF20"; break;
        case "Strength": tierColor = "#9b59b6"; break;
        case "Bravery": tierColor = "#e67e22"; break;
        case "Tenacity": tierColor = "#3498db"; break;
        default: tierColor = "#fff";
    }
    
    // Get the correct version (base or mod)
    const version = isMod && skill.mod ? "mod" : "base";
    const versionData = skill[version] || {};
    
    // Format damage display
    let damageDisplay = "None";
    if (versionData.damage) {
        if (Array.isArray(versionData.damage)) {
            damageDisplay = `${versionData.damage[0]}% ~ ${versionData.damage[1]}%`;
            if (versionData.hits > 1) {
                damageDisplay += ` (${versionData.hits} hits)`;
            }
        } else {
            damageDisplay = `${versionData.damage}%`;
        }
    }
    
    // Build popup content
    popup.innerHTML = `
        <div class="skill-popup-header">
            <img src="${skill.icon}">
            <div>
                <div class="skill-tier" style="color: ${tierColor};">${skill.tier}</div>
                <div class="skill-name">${skill.name}${isMod ? " [Mod]" : ""}</div>
                <div class="skill-type">${skill.type}</div>
            </div>
        </div>
        <div class="skill-popup-body">
            <div><strong>Damage:</strong> ${damageDisplay}</div>
            ${versionData.effects?.length ? `
                <div class="skill-effects">
                    <strong>Effects:</strong>
                    <ul>${versionData.effects.map(e => `<li>${e}</li>`).join("")}</ul>
                </div>
            ` : ''}
            
            ${skill.conditions ? `
                <div class="skill-conditions">
                    <strong>Conditional Effects:</strong>
                    ${Object.entries(skill.conditions).map(([cond, data]) => `
                        <div class="condition">
                            <div class="condition-name">${cond}:</div>
                            <div>Damage: ${Array.isArray(data.damage) ? 
                                `${data.damage[0]}% ~ ${data.damage[1]}%` : `${data.damage}%`}</div>
                            ${data.effects?.length ? `
                                <ul>${data.effects.map(e => `<li>${e}</li>`).join("")}</ul>
                            ` : ''}
                        </div>
                    `).join("")}
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(popup);
    
    const closePopup = (e) => {
        if (!popup.contains(e.target) && e.target !== parentElement) {
            popup.remove();
            document.removeEventListener("click", closePopup);
        }
    };
    
    setTimeout(() => {
        document.addEventListener("click", closePopup);
    }, 100);
}
});
