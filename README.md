The Factorial Experiment Viewer allows you to create web application instances
for exploring factorial gene expression experiments (there will be a
one-to-one relationship between experiment and application instance). This
README describes the steps that you need to take in order to create a new
application instance for your experiment.

WARRANTY DISCLAIMER AND COPYRIGHT NOTICE
========================================

The Jackson Laboratory makes no representation about the suitability or accuracy
of this software for any purpose, and makes no warranties, either express or
implied, including merchantability and fitness for a particular purpose or that
the use of this software will not infringe any third party patents, copyrights,
trademarks, or other rights. The software are provided "as is".

This software is provided to enhance knowledge and encourage progress in the
scientific community. This is free software: you can redistribute it and/or
modify it under the terms of the GNU General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

Python Environment
==================

This application requires that the following python packages be installed:

* flask
* pymongo
* scipy

Importing a New Dataset
=======================

Modify `config.py` to point to the mongo database that you would like to import your dataset into. The configuration
variables that you may want to chagne are: `MONGO_SERVER`, `MONGO_PORT`, and `MONGO_DATABASE`

Run the import script on the design and data files that you have like:

    python src/importdesnp.py path_to_design_file path_to_intensities_file

Design file format
------------------

The design file must be tab-separated and must have a header row. There is one special header column name
`SampleID` which must be present in order to match up samples described in the design file with samples
described in the data file. All other columns will be treated as sample factors where the header gives the
factor ID and corresponding cell values in each row give the factor value. This following is an example
of a valid sample file, except that '|' was used to seperate data cells rather than a tab character for
the sake of readability:

    SrNO|SampleID |rep_no|vector                     |time  |treatment ros   |treatment
    1   |ROS_24_1 |1     |Empty vector control       |24 hrs|Rosiglitazone   |ROS
    2   |NONE_24_1|1     |Empty vector control       |24 hrs|No Rosiglitazone|NONE
    3   |ROS_24_2 |2     |Empty vector control       |24 hrs|Rosiglitazone   |ROS
    4   |NONE_24_2|2     |Empty vector control       |24 hrs|No Rosiglitazone|NONE
    5   |ROS_72_1 |1     |Empty vector control       |72 hrs|Rosiglitazone   |ROS
    6   |NONE_72_1|1     |Empty vector control       |72 hrs|No Rosiglitazone|NONE
    7   |NONE_72_2|2     |Empty vector control       |72 hrs|No Rosiglitazone|NONE
    8   |ACT_2_1  |1     |PPARg2 expression construct|2 hrs |Rosiglitazone   |ACT
    9   |PPAR_2_1 |1     |PPARg2 expression construct|2 hrs |No Rosiglitazone|PPAR
    10  |ROS_2_1  |1     |Empty vector control       |2 hrs |Rosiglitazone   |ROS
    11  |NONE_2_1 |1     |Empty vector control       |2 hrs |No Rosiglitazone|NONE
    12  |ACT_2_2  |2     |PPARg2 expression construct|2 hrs |Rosiglitazone   |ACT
    13  |PPAR_2_2 |2     |PPARg2 expression construct|2 hrs |No Rosiglitazone|PPAR
    14  |ROS_2_2  |2     |Empty vector control       |2 hrs |Rosiglitazone   |ROS
    15  |NONE_2_2 |2     |Empty vector control       |2 hrs |No Rosiglitazone|NONE
    16  |ACT_24_1 |1     |PPARg2 expression construct|24 hrs|Rosiglitazone   |ACT
    17  |PPAR_24_1|1     |PPARg2 expression construct|24 hrs|No Rosiglitazone|PPAR
    18  |ACT_24_2 |2     |PPARg2 expression construct|24 hrs|Rosiglitazone   |ACT
    19  |PPAR_24_2|2     |PPARg2 expression construct|24 hrs|No Rosiglitazone|PPAR
    20  |ACT_72_1 |1     |PPARg2 expression construct|72 hrs|Rosiglitazone   |ACT
    21  |PPAR_72_1|1     |PPARg2 expression construct|72 hrs|No Rosiglitazone|PPAR
    22  |ACT_72_2 |2     |PPARg2 expression construct|72 hrs|Rosiglitazone   |ACT
    23  |PPAR_72_2|2     |PPARg2 expression construct|72 hrs|No Rosiglitazone|PPAR
    24  |ROS_72_2 |2     |Empty vector control       |72 hrs|Rosiglitazone   |ROS


Data file format
----------------

The data file is a tab-separated file with the following column names being required:

* Gene ID
* Gene Symbol
* Chr: the chromosome where the gene is located
* Start: the start position of the gene in base pairs
* End: the end position of the gene in base pairs

All other column headers will either match the `SampleID` given in the design file or will be ignored by the importer.
The columns matching the `SampleID`s given in the design file are expected to contain expression intensity data for
the gene indicated by `Gene ID` for that sample. The following is an example of this format (again with '|' used in place
of tabs for readability and with '...' indicating that there are more rows/columns following the same pattern as
previous rows/columns):

    Gene ID           |Gene Symbol  |Gene Name                  |Strand|Chr|Start    |End      |ROS_24_1   |NONE_24_1  |ROS_24_2   | ...
    ENSMUSG00000028184|Lphn2        |latrophilin 2              |-1    |3  |148815586|148989316|9.042631039|8.293670595|8.20514592 | ...
    ENSMUSG00000031807|Pgls         |6-phosphogluconolactonase  |1     |8  |71592176 |71601092 |10.32554137|9.877984089|9.628233677| ...
    ENSMUSG00000046750|BC089491     |cDNA sequence BC089491     |-1    |7  |28284652 |28291186 |6.779451615|7.256347254|7.00841675 | ...
    ENSMUSG00000028185|Dnase2b      |deoxyribonuclease II beta  |-1    |3  |146580985|146596612|5.992024924|6.055241655|6.113025636| ...
    ENSMUSG00000031805|Jak3         |Janus kinase 3             |1     |8  |71676296 |71690575 |6.745079548|6.972515763|6.627984883| ...
    ENSMUSG00000097766|5730420D15Rik|RIKEN cDNA 5730420D15 gene |1     |10 |95417375 |95428640 |5.99101324 |6.152623044|6.109452745| ...
    ...               |...          |...                        |...   |...|...      |...      |...        |...        |...        | ...

Configuring the web application
===============================

You will have to modify the `WEB_APP_CONF` dictionary in `src/config.py` to correspond to your
experiment before you can start your web application. This dictionary contains information that
is necessary for rendering plots and organizing the user interface which is not available in the
design and data files. For example, this data structure will answer questions like:

* what title and labels should be used to describe the experiment?
* what point size should we use in plots?
* for factors (categorical variables):
    * what order should the levels be presented in?
    * how should points corresponding to a particular level be styled (eg shape, color etc.)?
    * what combination of factors should the user be able to assign to the X axis in
      factorial plots?
* should we use error bars and if so should they be connected with a line?

The configuration file (`src/config.py`) contains a commented example configuration which describe
how the configuration variables work. You can also find other configuration file examples in the
repository by looking at files with the name pattern `src/config*.py`.

Running the application
=======================

For a production configuration you can run this application using apache + mod_wsgi. For running
a local development instance you can run the application by issuing the following command:
`python src/application.py`. This assumes that there is a mongo DB running, that experiment data
has already been imported and that `config.py` has been updated as described above.
