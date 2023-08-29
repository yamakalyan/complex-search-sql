
recruiter.post("/latest/search", (req, res) => {
  try {
    const headerKey = process.env.JWT_HEADER;
    const secureKey = process.env.JWT_SECURE;
    const header = req.header(headerKey);
    const verify = jwt.verify(header, secureKey);

    if (verify) {
    const userInput = req.body.q;
    const locationUser = req.body.location;
    const lowercaseInput = userInput.toLowerCase();

    // This separates words before ()
    const designationPartFromInput = lowercaseInput.split(/\s+\(/)[0].trim();

    let skillsValue = "";

    if (lowercaseInput.includes("(")) {
      const skillsHandler = () => {
        var skillsPartFromInput = lowercaseInput.match(/\(([^)]+)\)/)[1].trim();

        const convertToArray = skillsPartFromInput.split(" or ");

        const mappingOr = convertToArray.map((keywordOR) => {
          const splitInputWordsForAND = keywordOR.split(" and ");

          const mappingAND = splitInputWordsForAND
            .map((keywordAND) => `user_skills LIKE '%${keywordAND.trim()}%'`)
            .join(" AND ");
          return `(${mappingAND})`;
        });

        const addingOrToSkills = mappingOr.join(" OR ");

        return " AND " + addingOrToSkills;
      };
      skillsValue = skillsHandler();
    }

    const splitInputWordsForOR = designationPartFromInput.split(" or ");

    const mappingOr = splitInputWordsForOR.map((keywordOR) => {
      const splitInputWordsForAND = keywordOR.split(" and ");

      const mappingAND = splitInputWordsForAND
        .map((keywordAND) => `user_designation LIKE '%${keywordAND.trim()}%'`)
        .join(" AND ");
      return `(${mappingAND})`;
    });

    const addingORtoAND = mappingOr.join(" OR ");

    let searchSQl = `SELECT * FROM  sales_recruiters_data`;
    if (userInput.length != 0) {
      searchSQl += ` WHERE ${addingORtoAND + skillsValue}`;
    } else {
      searchSQl += ` ORDER BY id DESC`;
    }

    if (locationUser.length != 0) {
      searchSQl += ` AND user_location LIKE '%${locationUser}%'`;
    }

    // console.log(searchSQl);

    database.query(searchSQl, (err, results) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: "HavingIssues",
          err,
        });
      } else {
        if (results.length == 0) {
          res.status(400).json({
            success: false,
            message: "No users found",
          });
        } else {
          res.status(200).json({
            success: true,
            message: "Successfully found users",
            results,
          });
        }
      }
    });
    } else {
      res.status(401).json({
        success: false,
        message: "invalidToken",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error,
    });
  }
});
